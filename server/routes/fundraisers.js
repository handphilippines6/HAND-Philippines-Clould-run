/**
 * Fundraiser portal endpoints — port of post_fundraiserLogin,
 * post_verifyFundraiserSession, post_updateFundraiserSettings.
 *
 * Contracts (unchanged):
 *   POST /fundraiserLogin {email, password} -> {success, sessionKey}
 *   POST /verifyFundraiserSession {sessionKey}
 *     -> {success, fundraiser, campaign, metrics, donations}
 *   POST /updateFundraiserSettings {sessionKey, fundraiserId, name,
 *        profilePhotoUrl, story} -> {success, fundraiser}
 */
import crypto from 'node:crypto';
import * as store from '../store.js';
import { persistAuditEvent } from '../audit.js';
import { normalizeDonationStatus, DONATION_SUCCESS_STATUSES } from '../canonical.js';
import { normalizeEmail } from '../validation.js';

const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // fundraiser sessions live 12 hours

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password || '')).digest('hex');
}

export async function fundraiserLogin(input = {}) {
  const email = normalizeEmail(input.email);
  const password = String(input.password || '');
  if (!email || !password) {
    return { ok: false, success: false, error: 'Email and password are required.' };
  }

  const profile = store.first('FundraiserProfiles', (row) => normalizeEmail(row.email) === email);
  const user = store.first('Users', (row) => normalizeEmail(row.email) === email);
  const fundraiser = store.first('Fundraisers', (row) => normalizeEmail(row.email) === email);

  const passwordOk =
    (profile && profile.passwordHash === hashPassword(password)) ||
    (user && user.passwordHash === hashPassword(password));

  if (!passwordOk || (!fundraiser && !profile)) {
    await persistAuditEvent('FUNDRAISER_LOGIN_FAILED', { emailHash: hashForAudit(email) });
    return { ok: false, success: false, error: 'Those credentials do not match a fundraiser account.' };
  }

  const sessionKey = `fsk_${crypto.randomBytes(24).toString('hex')}`;
  store.insert('FundraiserSessions', {
    _id: sessionKey,
    email,
    fundraiserId: (fundraiser || profile)?.fundraiserId || fundraiser?._id || null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  });
  await persistAuditEvent('FUNDRAISER_LOGIN_SUCCEEDED', { emailHash: hashForAudit(email) });
  return { ok: true, success: true, sessionKey };
}

function hashForAudit(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex').slice(0, 32);
}

export function verifyFundraiserSession(sessionKey) {
  const session = store.get('FundraiserSessions', sessionKey);
  if (!session || new Date(session.expiresAt) < new Date()) {
    throw new Error('Your session is missing or expired. Please sign in again.');
  }

  const fundraiser =
    (session.fundraiserId && store.get('Fundraisers', session.fundraiserId)) ||
    store.first('Fundraisers', (row) => normalizeEmail(row.email || '') === normalizeEmail(session.email || ''));

  if (!fundraiser) throw new Error('No fundraiser profile is linked to this account.');

  const campaign = fundraiser.campaignId
    ? store.first('Campaigns', (row) => row._id === fundraiser.campaignId)
    : null;
  const donations = store
    .query('Donations', (row) => row.fundraiserId === fundraiser._id)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  const succeeded = donations.filter((row) => DONATION_SUCCESS_STATUSES.includes(normalizeDonationStatus(row.status)));
  const totalRaisedCents = succeeded.reduce((total, row) => total + Math.round(Number(row.amountCents || 0)), 0);
  const averageGiftCents = succeeded.length ? Math.round(totalRaisedCents / succeeded.length) : 0;
  const goalCents = Number(campaign?.goalCents ?? 0);

  return {
    fundraiser: {
      ...fundraiser,
      raisedCents: totalRaisedCents,
    },
    campaign: campaign
      ? {
          ...campaign,
          raisedCents: totalRaisedCents,
          goalCents,
          status: campaign.status || 'ACTIVE',
        }
      : null,
    metrics: {
      totalRaisedCents,
      averageGiftCents,
      donorCount: new Set(succeeded.map((row) => normalizeEmail(row.donorEmail || '') || row.donationId)).size,
      patientsHelped: succeeded.length * 3,
    },
    donations: donations.map((row) => ({
      id: row.donationId || row._id,
      createdAt: row.paidAt || row.createdAt,
      donorName: row.donorName || 'Supporter',
      anonymous: row.isAnonymous === true,
      amountCents: row.amountCents,
      status: normalizeDonationStatus(row.status) || 'succeeded',
    })),
  };
}

export async function updateFundraiserSettings(input = {}) {
  const session = store.get('FundraiserSessions', String(input.sessionKey || ''));
  if (!session || new Date(session.expiresAt) < new Date()) {
    return { ok: false, success: false, error: 'Your session is missing or expired. Please sign in again.' };
  }

  const fundraiser = session.fundraiserId
    ? store.get('Fundraisers', session.fundraiserId)
    : store.first('Fundraisers', (row) => normalizeEmail(row.email || '') === normalizeEmail(session.email || ''));
  if (!fundraiser) {
    return { ok: false, success: false, error: 'No fundraiser profile is linked to this account.' };
  }

  const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
  const updated = store.update('Fundraisers', {
    ...fundraiser,
    name: clean(input.name, 120) || fundraiser.name,
    profilePhotoUrl: clean(input.profilePhotoUrl, 500) || fundraiser.profilePhotoUrl,
    story: clean(input.story, 5000) || fundraiser.story,
    updatedAt: new Date().toISOString(),
  });
  await persistAuditEvent('FUNDRAISER_SETTINGS_UPDATED', { fundraiserId: fundraiser._id });
  return { ok: true, success: true, fundraiser: updated };
}
