/**
 * Canonical schema helpers — port of backend/canonical.js.
 * Donations (canonical write fields):
 *   donorEmail, donorPhone, donorName, isAnonymous, amountCents (integer cents),
 *   status in: CREATED, PENDING, PROCESSING, SUCCEEDED, FAILED, CANCELLED,
 *              REFUNDED, DISPUTED.
 *   Legacy aliases accepted on read only: PAID, SUCCESSFUL (both = SUCCEEDED).
 * Campaigns: goalCents/raisedCents (integer cents), status ('ACTIVE').
 *   Legacy read fallbacks: targetGoal/currentRaised (dollars).
 * Fundraisers: raisedCents/goalCents (integer cents), status ('ACTIVE').
 */
export const DONATION_SUCCESS_STATUSES = ['SUCCEEDED', 'PAID', 'SUCCESSFUL'];
export const CAMPAIGN_ACTIVE_STATUSES = ['ACTIVE', 'active', 'Active'];

export function normalizeDonationStatus(status) {
  const raw = String(status || '').toUpperCase();
  if (raw === 'PAID' || raw === 'SUCCESSFUL') return 'SUCCEEDED';
  if (raw === 'CANCELED') return 'CANCELLED';
  return raw;
}

export function readIsAnonymous(record) {
  if (!record) return false;
  if (typeof record.isAnonymous === 'boolean') return record.isAnonymous;
  return record.anonymousFlag === true;
}

export function readGoalCents(campaign) {
  if (!campaign) return 0;
  const cents = Number(campaign.goalCents);
  if (Number.isFinite(cents) && cents > 0) return Math.round(cents);
  const dollars = Number(campaign.targetGoal);
  return Number.isFinite(dollars) && dollars > 0 ? Math.round(dollars * 100) : 0;
}

export function readRaisedCents(campaign) {
  if (!campaign) return 0;
  const cents = Number(campaign.raisedCents);
  if (Number.isFinite(cents) && cents > 0) return Math.round(cents);
  const legacyDollars = Number(campaign.currentRaised != null ? campaign.currentRaised : campaign.donationRaised);
  return Number.isFinite(legacyDollars) && legacyDollars > 0 ? Math.round(legacyDollars * 100) : 0;
}

export function readCampaignStatus(campaign) {
  if (!campaign) return '';
  if (campaign.status) return String(campaign.status);
  if (campaign.campaignStatus) return String(campaign.campaignStatus);
  return '';
}

export function isCampaignActive(campaign) {
  return readCampaignStatus(campaign).toLowerCase() === 'active';
}

/** Slug lookups tolerate both slug field names and both status field names. */
export function queryActiveCampaignBySlug(campaigns, slug) {
  if (!slug || typeof slug !== 'string') return null;
  const needle = slug.trim().toLowerCase();
  return (
    campaigns.find(
      (campaign) =>
        [campaign.slug, campaign.urlSlug].some((value) => String(value || '').toLowerCase() === needle) &&
        CAMPAIGN_ACTIVE_STATUSES.includes(readCampaignStatus(campaign)),
    ) || null
  );
}
