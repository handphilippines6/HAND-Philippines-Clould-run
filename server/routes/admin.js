/**
 * Admin endpoints — port of the admin section of backend/http-functions.js.
 *
 * The live site recognizes admins through the Wix member session
 * (GET /currentAdmin). This portable backend keeps the same endpoint shape but
 * issues its own session: POST /adminLogin {email, password} creates a
 * short-lived AdminSession; every protected endpoint requires
 * Authorization: Bearer <sessionKey>.
 *
 * Contracts (unchanged):
 *   GET  /currentAdmin        -> {success, loggedIn, isAdmin, email}
 *   POST /adminLogin          -> {success, sessionKey, expiresAt, admin}
 *   POST /verifyAdminSession  -> {success, admin, permissions, expiresAt}
 *   POST /adminLogout         -> {success}
 *   GET  /adminOverview       -> {success, metrics, recentDonations, campaigns, fundraisers}
 *   GET  /adminDonations|adminCampaigns|adminFundraisers|adminContent|
 *        adminUsers|adminSettings|adminAuditLog|adminInterests
 *   POST /adminRefund         -> {success, refund, donation}
 *   POST /adminInterestStatus -> {success, application, allowedTransitions}
 */
import crypto from 'node:crypto';
import * as store from '../store.js';
import { persistAuditEvent } from '../audit.js';
import { normalizeDonationStatus, DONATION_SUCCESS_STATUSES } from '../canonical.js';
import { normalizeEmail } from '../validation.js';

const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // admin sessions live 8 hours

const INTEREST_LADDER = {
  NEW: ['REVIEWING', 'DECLINED'],
  REVIEWING: ['APPROVED', 'DECLINED', 'NEW'],
  APPROVED: ['COMPLETED', 'DECLINED'],
  DECLINED: ['NEW'],
  COMPLETED: [],
};

async function adminSession(request) {
  const header = request.headers?.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const key = match ? match[1].trim() : '';
  if (!key) return null;
  const session = await store.get('AdminSessions', key);
  if (!session || new Date(session.expiresAt) < new Date()) return null;
  return session;
}

export function currentAdmin() {
  // The portable backend has no Wix member session; the SPA's admin portal
  // uses /adminLogin. Report the documented shape with loggedIn=false.
  return { success: true, loggedIn: false, isAdmin: false, email: null };
}

export async function adminLogin(input = {}) {
  const email = normalizeEmail(input.email);
  const password = String(input.password || '');
  const user = await store.first('Users', (row) => normalizeEmail(row.email || '') === email && row.role === 'ADMIN');
  if (!user || user.passwordHash !== crypto.createHash('sha256').update(password).digest('hex')) {
    await persistAuditEvent('ADMIN_LOGIN_FAILED', { emailHash: email.slice(0, 3) + '***' });
    return { ok: false, success: false, error: 'Those credentials do not match an administrator account.' };
  }

  const sessionKey = `ask_${crypto.randomBytes(24).toString('hex')}`;
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await store.insert('AdminSessions', {
    _id: sessionKey,
    email,
    createdAt: new Date().toISOString(),
    expiresAt,
  });
  await persistAuditEvent('ADMIN_LOGIN_SUCCEEDED', { emailHash: email.slice(0, 3) + '***' });
  return { ok: true, success: true, sessionKey, expiresAt, admin: { email, role: 'ADMIN' } };
}

export async function verifyAdminSession(sessionKey) {
  const session = await store.get('AdminSessions', sessionKey);
  if (!session || new Date(session.expiresAt) < new Date()) {
    throw new Error('Your admin session is missing or expired. Please sign in again.');
  }
  return {
    admin: { email: session.email, role: 'ADMIN' },
    permissions: ['overview', 'donations', 'campaigns', 'fundraisers', 'content', 'users', 'settings', 'audit', 'applications'],
    expiresAt: session.expiresAt,
  };
}

export async function adminLogout(sessionKey) {
  if (sessionKey) await store.remove('AdminSessions', sessionKey);
  return { ok: true, success: true };
}

/* ---------------------------- Overview ---------------------------- */
export async function adminOverview() {
  const donations = await store.query('Donations');
  const succeeded = donations.filter((row) => DONATION_SUCCESS_STATUSES.includes(normalizeDonationStatus(row.status)));
  const totalRaisedCents = succeeded.reduce((total, row) => total + Math.round(Number(row.amountCents || 0)), 0);

  const [campaigns, fundraisers, contactMessages, openInterests] = await Promise.all([
    store.all('Campaigns'),
    store.all('Fundraisers'),
    store.all('ContactMessages'),
    store.query('Interests', (row) => row.status !== 'DECLINED' && row.status !== 'COMPLETED'),
  ]);

  return {
    metrics: {
      totalRaisedCents,
      donationCount: donations.length,
      succeededCount: succeeded.length,
      campaignCount: campaigns.length,
      fundraiserCount: fundraisers.length,
      contactMessageCount: contactMessages.length,
      openInterests: openInterests.length,
    },
    recentDonations: donations
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, 10)
      .map(publicDonationRow),
    campaigns: campaigns.slice(0, 5),
    fundraisers: fundraisers.slice(0, 5),
  };
}

function publicDonationRow(row) {
  return {
    _id: row._id,
    donationId: row.donationId,
    donorName: row.isAnonymous ? 'Anonymous' : row.donorName || '—',
    donorEmail: row.donorEmail || '—',
    amountCents: row.amountCents,
    status: normalizeDonationStatus(row.status) || row.status,
    campaignId: row.campaignId || '',
    fundraiserId: row.fundraiserId || '',
    impactCategory: row.impactCategory || '',
    createdAt: row.createdAt,
    paidAt: row.paidAt || null,
  };
}

/* ------------------------- List endpoints ------------------------- */
export async function adminDonations() {
  const rows = await store.query('Donations');
  return {
    items: rows
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .map(publicDonationRow),
  };
}

export async function adminCampaigns() {
  return { items: await store.all('Campaigns') };
}

export async function adminFundraisers() {
  return { items: await store.all('Fundraisers') };
}

export async function adminContent() {
  return { items: await store.all('Programs') };
}

export async function adminUsers() {
  const users = await store.all('Users');
  return {
    items: users.map((user) => ({
      _id: user._id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })),
  };
}

export async function adminSettings() {
  return {
    items: await store.all('Settings'),
    stripeMode: String(process.env.STRIPE_MODE || 'auto'),
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY || process.env.TEST_STRIPE_SECRET_KEY),
  };
}

export async function adminAuditLog(searchParams) {
  const eventType = searchParams.get('eventType');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const limit = Math.min(200, Number(searchParams.get('limit')) || 50);
  const skip = Number(searchParams.get('skip')) || 0;

  let items = (await store.query('AuditLog')).sort((a, b) =>
    String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
  );
  const filters = { eventType: eventType || null, from: from || null, to: to || null };
  if (eventType) items = items.filter((row) => row.eventType === eventType);
  if (from) items = items.filter((row) => row.createdAt >= from);
  if (to) items = items.filter((row) => row.createdAt <= to);

  return {
    items: items.slice(skip, skip + limit),
    pagination: { total: items.length, limit, skip },
    filters,
  };
}

/* --------------------------- Mutations ---------------------------- */
export async function adminRefund(input = {}) {
  const donationId = String(input.donationId || '').trim();
  if (!donationId) return { ok: false, success: false, error: 'A donation ID is required.' };

  const donation =
    (await store.first('Donations', (row) => row.donationId === donationId)) ||
    (await store.first('Donations', (row) => row._id === donationId));
  if (!donation) return { ok: false, success: false, error: 'Donation not found.' };
  if (!DONATION_SUCCESS_STATUSES.includes(normalizeDonationStatus(donation.status))) {
    return { ok: false, success: false, error: 'Only completed donations can be refunded.' };
  }
  if (!donation.paymentIntentId) {
    return { ok: false, success: false, error: 'This donation has no Stripe payment to refund.' };
  }

  const amountCents = input.amountCents ? Math.round(Number(input.amountCents)) : undefined;
  const refundId = `re_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const refund = {
    _id: refundId,
    donationId: donation.donationId || donation._id,
    paymentIntentId: donation.paymentIntentId,
    amountCents: amountCents || donation.amountCents,
    reason: String(input.reason || '').slice(0, 200) || null,
    note: String(input.note || '').slice(0, 500) || null,
    status: 'SUBMITTED',
    createdAt: new Date().toISOString(),
  };
  await store.insert('Refunds', refund);
  await persistAuditEvent('DONATION_REFUND_REQUESTED', {
    donationId: donation.donationId,
    refundId,
    amountCents: refund.amountCents,
  });

  return {
    ok: true,
    success: true,
    refund,
    donation: {
      ...donation,
      status: donation.status,
      note: 'The REFUNDED status is written by the verified Stripe webhook.',
    },
  };
}

export async function adminInterestStatus(input = {}) {
  const interestId = String(input.interestId || '').trim();
  const status = String(input.status || '').trim().toUpperCase();
  if (!interestId || !status) {
    return { ok: false, success: false, error: 'An application ID and a status are required.' };
  }

  const application =
    (await store.first('Interests', (row) => row._id === interestId)) ||
    (await store.first('Interests', (row) => row.interestId === interestId));
  if (!application) return { ok: false, success: false, error: 'Application not found.' };

  const current = application.status || 'NEW';
  const allowedTransitions = INTEREST_LADDER[current] || [];
  if (!allowedTransitions.includes(status)) {
    return { ok: false, success: false, error: `Status ${status} is not allowed from ${current}.`, allowedTransitions };
  }

  const updated = await store.update('Interests', {
    ...application,
    status,
    note: String(input.note || '').slice(0, 500) || application.note || null,
    updatedAt: new Date().toISOString(),
  });
  await persistAuditEvent('INTEREST_STATUS_UPDATED', { interestId, from: current, to: status });
  return { ok: true, success: true, application: updated, allowedTransitions: INTEREST_LADDER[status] || [] };
}

/* Re-export for the router's bearer check. */
export { adminSession as requireAdminSession };

export async function adminInterests(searchParams) {
  const status = searchParams.get('status');
  const open = searchParams.get('open') === '1';
  const limit = Math.min(200, Number(searchParams.get('limit')) || 50);
  const skip = Number(searchParams.get('skip')) || 0;

  let items = (await store.query('Interests')).sort((a, b) =>
    String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
  );
  if (status) items = items.filter((row) => (row.status || 'NEW') === status);
  if (open) items = items.filter((row) => row.status !== 'DECLINED' && row.status !== 'COMPLETED');

  const [allInterests, openInterests] = await Promise.all([
    store.all('Interests'),
    store.query('Interests', (row) => row.status !== 'DECLINED' && row.status !== 'COMPLETED'),
  ]);
  const summary = {
    total: allInterests.length,
    open: openInterests.length,
  };
  return { items: items.slice(skip, skip + limit), summary, pagination: { total: items.length, limit, skip } };
}
