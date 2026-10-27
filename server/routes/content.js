/**
 * Public content endpoints — port of get_programs / get_program / get_campaign /
 * get_donors / get_fundraiser / get_fundraiserDonors.
 *
 * Response shapes match the Wix backend exactly (the React SPA reads them):
 *   GET /programs            -> { success, programs: [...] }
 *   GET /program?slug=       -> { success, program } | 404 { success, error }
 *   GET /campaign?id=|slug=  -> { success, campaign } | 404
 *   GET /donors?campaign=    -> { success, donors: [...] } (anonymous-safe)
 *   GET /fundraiser?slug=    -> { success, fundraiser } (campaign nested)
 *   GET /fundraiserDonors?slug= -> { success, supporters: [...] }
 */
import * as store from '../store.js';
import { isCampaignActive, normalizeDonationStatus, DONATION_SUCCESS_STATUSES, readRaisedCents, readGoalCents } from '../canonical.js';

export function listPrograms() {
  return store.query('Programs', (program) => !program.status || String(program.status).toLowerCase() === 'active');
}

export function getProgramBySlug(slug) {
  const needle = String(slug || '').trim().toLowerCase();
  return store.first('Programs', (program) => String(program.slug || '').toLowerCase() === needle) || null;
}

export function getCampaignByIdOrSlug({ id, slug }) {
  let campaign = null;
  if (slug) {
    const needle = String(slug).trim().toLowerCase();
    campaign = store.first(
      'Campaigns',
      (row) =>
        [row.slug, row.urlSlug].some((value) => String(value || '').toLowerCase() === needle) &&
        isCampaignActive(row),
    );
  }
  if (!campaign && id) {
    campaign = store.first('Campaigns', (row) => row._id === id) || null;
  }
  if (!campaign) return null;
  if (!isCampaignActive(campaign)) return null;
  return withCampaignProgress(campaign);
}

function withCampaignProgress(campaign) {
  const raisedCents = store
    .query('Donations', (row) => row.campaignId === campaign._id && DONATION_SUCCESS_STATUSES.includes(normalizeDonationStatus(row.status)))
    .reduce((total, row) => total + Math.round(Number(row.amountCents || 0)), 0);
  const donorCount = new Set(
    store
      .query('Donations', (row) => row.campaignId === campaign._id && DONATION_SUCCESS_STATUSES.includes(normalizeDonationStatus(row.status)))
      .map((row) => normalizeEmail(row.donorEmail || '') || row.donationId),
  ).size;
  const goalCents = readGoalCents(campaign) || Number(campaign.goalCents ?? 0);
  return {
    ...campaign,
    raisedCents,
    goalCents: goalCents || readGoalCents(campaign),
    progressPercentage: goalCents > 0 ? Math.min(100, (raisedCents / goalCents) * 100) : 0,
    donorCount,
  };
}

/** Anonymous-safe donor wall: first name + last initial, amount, when shared. */
export function listDonors(campaignId) {
  return store
    .query(
      'Donations',
      (row) =>
        row.campaignId === campaignId && DONATION_SUCCESS_STATUSES.includes(normalizeDonationStatus(row.status)),
    )
    .sort((a, b) => String(b.paidAt || b.createdAt || '').localeCompare(String(a.paidAt || a.createdAt || '')))
    .slice(0, 30)
    .map((row) => {
      if (readIsAnonymous(row)) return { name: 'Anonymous', amountCents: row.amountCents, date: row.paidAt || row.createdAt };
      const name = row.donorName || 'Supporter';
      const [first, ...rest] = name.split(' ');
      const displayName = rest.length ? `${first} ${rest[0][0]}.` : first;
      return { name: displayName, amountCents: row.amountCents, date: row.paidAt || row.createdAt };
    });
}

export function getFundraiserBySlug(slug) {
  const needle = String(slug || '').trim().toLowerCase();
  const fundraiser = store.first(
    'Fundraisers',
    (row) => String(row.slug || '').toLowerCase() === needle && (!row.status || String(row.status).toLowerCase() === 'active'),
  );
  if (!fundraiser) return null;

  const campaign = fundraiser.campaignId
    ? store.first('Campaigns', (row) => row._id === fundraiser.campaignId)
    : null;
  const raisedCents = store
    .query('Donations', (row) => row.fundraiserId === fundraiser._id && DONATION_SUCCESS_STATUSES.includes(normalizeDonationStatus(row.status)))
    .reduce((total, row) => total + Math.round(Number(row.amountCents || 0)), 0);

  return {
    ...fundraiser,
    raisedCents,
    campaign: campaign
      ? { ...withCampaignProgress(campaign), currency: campaign.currency || 'USD' }
      : null,
  };
}

export function listFundraiserSupporters(slug) {
  const needle = String(slug || '').trim().toLowerCase();
  const fundraiser = store.first('Fundraisers', (row) => String(row.slug || '').toLowerCase() === needle);
  if (!fundraiser) return [];
  return store
    .query(
      'Donations',
      (row) => row.fundraiserId === fundraiser._id && DONATION_SUCCESS_STATUSES.includes(normalizeDonationStatus(row.status)),
    )
    .sort((a, b) => String(b.paidAt || b.createdAt || '').localeCompare(String(a.paidAt || a.createdAt || '')))
    .slice(0, 30)
    .map((row) => ({
      name: readIsAnonymous(row) ? 'Anonymous' : row.donorName || 'Supporter',
      amountCents: row.amountCents,
      date: row.paidAt || row.createdAt,
    }));
}
