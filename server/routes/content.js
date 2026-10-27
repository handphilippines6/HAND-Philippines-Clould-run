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
 *
 * All handlers are async — the store may be file-backed (dev) or Firestore
 * (Cloud Run) behind the same promise-returning API.
 */
import * as store from '../store.js';
import { isCampaignActive, normalizeDonationStatus, DONATION_SUCCESS_STATUSES, readRaisedCents, readGoalCents } from '../canonical.js';
import { normalizeEmail } from '../validation.js';

export async function listPrograms() {
  return store.query('Programs', (program) => !program.status || String(program.status).toLowerCase() === 'active');
}

export async function getProgramBySlug(slug) {
  const needle = String(slug || '').trim().toLowerCase();
  return (await store.first('Programs', (program) => String(program.slug || '').toLowerCase() === needle)) || null;
}

export async function getCampaignByIdOrSlug({ id, slug }) {
  let campaign = null;
  if (slug) {
    const needle = String(slug).trim().toLowerCase();
    campaign = await store.first(
      'Campaigns',
      (row) =>
        [row.slug, row.urlSlug].some((value) => String(value || '').toLowerCase() === needle) &&
        isCampaignActive(row),
    );
  }
  if (!campaign && id) {
    campaign = (await store.first('Campaigns', (row) => row._id === id)) || null;
  }
  if (!campaign) return null;
  if (!isCampaignActive(campaign)) return null;
  return withCampaignProgress(campaign);
}

async function withCampaignProgress(campaign) {
  const donations = await store.query(
    'Donations',
    (row) => row.campaignId === campaign._id && DONATION_SUCCESS_STATUSES.includes(normalizeDonationStatus(row.status)),
  );
  const raisedCents = donations.reduce((total, row) => total + Math.round(Number(row.amountCents || 0)), 0);
  const donorCount = new Set(donations.map((row) => normalizeEmail(row.donorEmail || '') || row.donationId)).size;
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
export async function listDonors(campaignId) {
  const rows = await store.query(
    'Donations',
    (row) =>
      row.campaignId === campaignId && DONATION_SUCCESS_STATUSES.includes(normalizeDonationStatus(row.status)),
  );
  return rows
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

export async function getFundraiserBySlug(slug) {
  const needle = String(slug || '').trim().toLowerCase();
  const fundraiser = await store.first(
    'Fundraisers',
    (row) => String(row.slug || '').toLowerCase() === needle && (!row.status || String(row.status).toLowerCase() === 'active'),
  );
  if (!fundraiser) return null;

  const campaign = fundraiser.campaignId
    ? await store.first('Campaigns', (row) => row._id === fundraiser.campaignId)
    : null;
  const donations = await store.query(
    'Donations',
    (row) => row.fundraiserId === fundraiser._id && DONATION_SUCCESS_STATUSES.includes(normalizeDonationStatus(row.status)),
  );
  const raisedCents = donations.reduce((total, row) => total + Math.round(Number(row.amountCents || 0)), 0);

  return {
    ...fundraiser,
    raisedCents,
    campaign: campaign
      ? { ...(await withCampaignProgress(campaign)), currency: campaign.currency || 'USD' }
      : null,
  };
}

export async function listFundraiserSupporters(slug) {
  const needle = String(slug || '').trim().toLowerCase();
  const fundraiser = await store.first('Fundraisers', (row) => String(row.slug || '').toLowerCase() === needle);
  if (!fundraiser) return [];
  const rows = await store.query(
    'Donations',
    (row) => row.fundraiserId === fundraiser._id && DONATION_SUCCESS_STATUSES.includes(normalizeDonationStatus(row.status)),
  );
  return rows
    .sort((a, b) => String(b.paidAt || b.createdAt || '').localeCompare(String(a.paidAt || a.createdAt || '')))
    .slice(0, 30)
    .map((row) => ({
      name: readIsAnonymous(row) ? 'Anonymous' : row.donorName || 'Supporter',
      amountCents: row.amountCents,
      date: row.paidAt || row.createdAt,
    }));
}
