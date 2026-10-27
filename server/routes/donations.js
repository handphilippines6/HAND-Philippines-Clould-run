/**
 * Donation endpoints — port of the donation section of backend/http-functions.js
 * + stripeBackend.web.js + DonationService.web.js.
 *
 * Contracts (unchanged from the Wix backend):
 *   POST /createPaymentIntent       {campaignId, fundraiserId, amount (USD dollars),
 *                                    firstName, lastName, donorEmail,
 *                                    tributeMessage?, isAnonymous?, impactCategory?}
 *     -> {success, paymentIntentId, clientSecret, verificationToken}
 *   POST /updateDonationStatus      {paymentIntentId, verificationToken}
 *     -> {success, donation:{status, paidAt}}
 *   POST /createDonationSessionKey  {paymentIntentId, verificationToken}
 *     -> {success, sessionKey, expiresAt}
 *   POST /verifyDonationSession     {sessionKey}
 *     -> {success, donor, summary, donations, recurring}
 *   GET  /donationReceipt?id=       (Bearer session) -> application/pdf
 *   GET  /donationStatus?id=        -> {success, donationId, status}
 *   GET  /stripePublishableKey      -> {success, publishableKey}
 */
import crypto from 'node:crypto';
import * as store from '../store.js';
import { persistAuditEvent } from '../audit.js';
import { DONATION_SUCCESS_STATUSES, normalizeDonationStatus, readIsAnonymous } from '../canonical.js';
import {
  isValidDonationCents,
  normalizeEmail,
  toDonationCents,
  MIN_DONATION_CENTS,
  MAX_DONATION_CENTS,
} from '../validation.js';
import { getPublishableKey, getStripeMode, isConfigured, stripeRequest } from '../stripe.js';
import { generateDonationId, randomToken } from '../util.js';

const SESSION_TTL_MS = 1000 * 60 * 30; // donor dashboard sessions live 30 minutes

function cleanText(value, maxLength = 500) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

/* ------------------------------------------------------------------ *
 * Program / fundraiser resolution + validation (stripeBackend.web.js)
 * ------------------------------------------------------------------ */
async function resolveProgram(programId) {
  return (
    (await store.first('Programs', (program) => program._id === programId || program.slug === programId)) ||
    (await store.first('Campaigns', (campaign) => campaign._id === programId))
  );
}

async function validateProgram(programId) {
  const program = await resolveProgram(programId);
  if (!program) throw new Error('Program not found.');
  if (program.status && String(program.status).toLowerCase() !== 'active') {
    throw new Error('This program is not currently accepting donations.');
  }
  const now = new Date();
  if (program.startDate && now < new Date(program.startDate)) {
    throw new Error('This program has not started yet.');
  }
  if (program.endDate && now > new Date(program.endDate)) {
    throw new Error('This program has ended.');
  }
  return program;
}

async function validateFundraiser(campaignId, fundraiserId) {
  if (!fundraiserId) return null;
  const fundraiser = await store.first(
    'Fundraisers',
    (row) => row._id === fundraiserId || row.slug === fundraiserId,
  );
  if (!fundraiser) throw new Error('Fundraiser not found.');
  if (fundraiser.campaignId && campaignId && fundraiser.campaignId !== campaignId) {
    throw new Error('This fundraiser is not connected to the selected program.');
  }
  return fundraiser;
}

/* ------------------------------------------------------------------ *
 * createPaymentIntent (stripeBackend.web.js createPaymentIntent)
 * ------------------------------------------------------------------ */
export async function createPaymentIntent(input = {}) {
  try {
    const campaignId = cleanText(input.campaignId || input.programId, 120);
    const fundraiserId = cleanText(input.fundraiserId, 120) || null;
    const donorEmail = normalizeEmail(input.donorEmail || input.email);
    const firstName = cleanText(input.firstName, 80);
    const lastName = cleanText(input.lastName, 80);
    const donorName = `${firstName} ${lastName}`.trim() || cleanText(input.donorName, 160) || 'Anonymous';
    const impactCategory = cleanText(input.impactCategory || input.designation, 120) || 'Projects and Programs';
    const tributeMessage = cleanText(input.tributeMessage || input.comment, 500);
    const isAnonymous = input.isAnonymous === true || input.anonymous === true;

    const amountCents = toDonationCents(input.amount);
    if (!isValidDonationCents(amountCents)) {
      throw new Error(
        `A valid USD donation amount between $${MIN_DONATION_CENTS / 100} and $${MAX_DONATION_CENTS / 100} is required.`,
      );
    }
    if (!donorEmail) {
      throw new Error('A valid donor email address is required.');
    }
    await validateProgram(campaignId);
    await validateFundraiser(campaignId, fundraiserId);

    if (!isConfigured()) {
      throw new Error(
        'Online donations are temporarily unavailable. Please use the DAF or mail-a-check routes, or try again shortly.',
      );
    }

    const currency = 'usd';
    const requestedIntentId = cleanText(input.paymentIntentId, 200);
    const existing = requestedIntentId
      ? await store.first('Donations', (donation) => donation.paymentIntentId === requestedIntentId)
      : null;

    if (existing) {
      if (DONATION_SUCCESS_STATUSES.includes(normalizeDonationStatus(existing.status))) {
        throw new Error('This donation has already been completed.');
      }
      if (existing.campaignId !== campaignId || (existing.fundraiserId || null) !== fundraiserId) {
        throw new Error('Payment context does not match the pending donation.');
      }
      const paymentIntent = await stripeRequest('POST', `/v1/payment_intents/${existing.paymentIntentId}`, {
        amount: amountCents,
        metadata: {
          campaignId,
          fundraiserId: fundraiserId || '',
          donorName: donorName || 'Anonymous',
          impactCategory,
          tributeMessage,
          isAnonymous: String(isAnonymous),
          verificationToken: existing.verificationToken || crypto.randomBytes(32).toString('hex'),
        },
      });
      const verificationToken = existing.verificationToken || paymentIntent.metadata?.verificationToken;
      await store.update('Donations', {
        ...existing,
        amountCents,
        donorEmail: donorEmail || null,
        donorName: donorName || 'Anonymous',
        tributeMessage,
        impactCategory,
        isAnonymous,
        verificationToken,
        updatedAt: new Date().toISOString(),
      });
      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        verificationToken,
      };
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const donationId = generateDonationId();

    const paymentIntent = await stripeRequest('POST', '/v1/payment_intents', {
      amount: amountCents,
      currency,
      payment_method_types: ['card', 'link'],
      metadata: {
        programId: campaignId,
        campaignId,
        fundraiserId: fundraiserId || '',
        donorName: donorName || 'Anonymous',
        impactCategory,
        tributeMessage,
        isAnonymous: String(isAnonymous),
        verificationToken,
      },
    });

    await store.insert('Donations', {
      donationId,
      paymentIntentId: paymentIntent.id,
      programId: campaignId,
      campaignId,
      fundraiserId: fundraiserId || null,
      amountCents,
      currency: currency.toUpperCase(),
      status: 'CREATED',
      channel: 'ONLINE',
      provider: 'Stripe',
      donorEmail: donorEmail || null,
      donorPhone: null,
      donorName: donorName || 'Anonymous',
      tributeMessage,
      impactCategory,
      isAnonymous,
      verificationToken,
      livemode: paymentIntent.livemode === true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await persistAuditEvent('DONATION_INTENT_CREATED', {
      donationId,
      paymentIntentId: paymentIntent.id,
      amountCents,
      campaignId,
      fundraiserId: fundraiserId || null,
    });

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      verificationToken,
    };
  } catch (error) {
    console.error('[createPaymentIntent]', error);
    return { success: false, error: error.message || 'Unable to create payment.' };
  }
}

/* ------------------------------------------------------------------ *
 * Post-payment verification (updateDonationStatus): the browser proves
 * ownership with the verificationToken; the server reads the canonical
 * status back from Stripe and applies it.
 * ------------------------------------------------------------------ */
export async function verifyAndUpdateStatus(paymentIntentId, verificationToken) {
  const donation = await store.first('Donations', (row) => row.paymentIntentId === paymentIntentId);
  if (!donation) throw new Error('Donation record was not found.');
  if (!verificationToken || donation.verificationToken !== verificationToken) {
    throw new Error('This donation could not be verified.');
  }
  if (!isConfigured()) throw new Error('Payment verification is temporarily unavailable.');

  const intent = await stripeRequest('GET', `/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`);
  const statusMap = {
    succeeded: 'SUCCEEDED',
    processing: 'PROCESSING',
    requires_payment_method: 'PENDING',
    requires_confirmation: 'PENDING',
    canceled: 'CANCELLED',
  };
  const canonical = statusMap[String(intent.status || '').toLowerCase()] || normalizeDonationStatus(intent.status);

  const previous = normalizeDonationStatus(donation.status);
  const updated = await store.update('Donations', {
    ...donation,
    status: canonical,
    paidAt: canonical === 'SUCCEEDED' ? donation.paidAt || new Date().toISOString() : donation.paidAt || null,
    updatedAt: new Date().toISOString(),
  });

  if (canonical === 'SUCCEEDED' && !DONATION_SUCCESS_STATUSES.includes(previous)) {
    await applySuccessfulTotals(updated);
  }
  return updated;
}

/* Totals roll-up (DonationService.web.js updateProgramTotals/updateFundraiserTotals). */
async function sumSuccessful(matchValue, field) {
  const rows = await store.query(
    'Donations',
    (row) => row[field] === matchValue && DONATION_SUCCESS_STATUSES.includes(normalizeDonationStatus(row.status)),
  );
  return rows.reduce((total, row) => total + Math.round(Number(row.amountCents || 0)), 0);
}

async function applySuccessfulTotals(donation) {
  await persistAuditEvent('DONATION_SUCCEEDED', {
    donationId: donation.donationId,
    amountCents: donation.amountCents,
    campaignId: donation.campaignId,
    fundraiserId: donation.fundraiserId || null,
  });

  const programTotal = await sumSuccessful(donation.campaignId, 'campaignId');
  const programRow =
    (await store.first('Programs', (row) => row._id === donation.campaignId)) ||
    (await store.first('Campaigns', (row) => row._id === donation.campaignId));
  if (programRow) {
    const collection = (await store.first('Programs', (row) => row._id === programRow._id)) ? 'Programs' : 'Campaigns';
    const goalCents = Number(programRow.goalCents ?? 0);
    await store.update(collection, {
      ...programRow,
      raisedCents: programTotal,
      currentRaised: programTotal / 100,
      progressPercentage: goalCents > 0 ? Math.min(100, (programTotal / goalCents) * 100) : 0,
      updatedAt: new Date().toISOString(),
    });
  }

  if (donation.fundraiserId) {
    const fundraiser = await store.first('Fundraisers', (row) => row._id === donation.fundraiserId);
    if (fundraiser) {
      const total = await sumSuccessful(fundraiser._id, 'fundraiserId');
      await store.update('Fundraisers', {
        ...fundraiser,
        raisedCents: total,
        currentRaised: total / 100,
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

/* ------------------------------------------------------------------ *
 * Donor dashboard sessions (createDonationSessionKey / verifyDonationSession)
 * ------------------------------------------------------------------ */
export async function createDonationSessionKey(paymentIntentId, verificationToken) {
  const donation = await store.first('Donations', (row) => row.paymentIntentId === paymentIntentId);
  if (!donation) throw new Error('Donation record was not found.');
  if (!verificationToken || donation.verificationToken !== verificationToken) {
    throw new Error('This donation could not be verified.');
  }

  const sessionKey = `dsk_${crypto.randomBytes(24).toString('hex')}`;
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await store.insert('DonorSessions', {
    _id: sessionKey,
    donorEmail: donation.donorEmail,
    donationId: donation.donationId,
    paymentIntentId,
    createdAt: new Date().toISOString(),
    expiresAt,
  });
  return { sessionKey, expiresAt };
}

export async function verifyDonationSession(sessionKey) {
  const session = await store.get('DonorSessions', sessionKey);
  if (!session || new Date(session.expiresAt) < new Date()) {
    throw new Error('Your dashboard session has expired. Please request a new code.');
  }

  const email = session.donorEmail;
  const donations = (
    await store.query('Donations', (row) => normalizeEmail(row.donorEmail || '') === normalizeEmail(email || ''))
  ).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

  const succeeded = donations.filter((row) =>
    DONATION_SUCCESS_STATUSES.includes(normalizeDonationStatus(row.status)),
  );
  const totalContributedCents = succeeded.reduce(
    (total, row) => total + Math.round(Number(row.amountCents || 0)),
    0,
  );

  const profile = await store.first('DonorProfiles', (row) => normalizeEmail(row.email) === normalizeEmail(email || ''));
  const donor = {
    firstName: profile?.firstName || (donations[0]?.donorName || '').split(' ')[0] || '',
    lastName: profile?.lastName || (donations[0]?.donorName || '').split(' ').slice(1).join(' '),
    email,
    phone: profile?.phone || donations[0]?.donorPhone || '',
  };

  return {
    donor,
    summary: {
      totalContributedCents,
      donationCount: donations.length,
      patientsHelped: succeeded.length * 3, // documented proxy: patients per gift (2027 mission estimate)
    },
    donations: donations.map((row) => ({
      id: row.donationId || row._id,
      date: row.paidAt || row.createdAt,
      amountCents: row.amountCents,
      designation: row.impactCategory || 'General support',
      status: normalizeDonationStatus(row.status) === 'SUCCEEDED' ? 'SUCCEEDED' : row.status || 'PENDING',
      receiptUrl: `/api/donationReceipt?id=${encodeURIComponent(row.donationId || row._id)}`,
    })),
    recurring: null,
  };
}

/* ------------------------------------------------------------------ *
 * Donation receipt — a small, dependency-free PDF writer that mirrors the
 * receipt contract (GET /donationReceipt?id= with a Bearer donor session).
 * ------------------------------------------------------------------ */
function pdfEscape(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function buildReceiptPdf(donation) {
  const amount = (Number(donation.amountCents || 0) / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  const paid = donation.paidAt
    ? new Date(donation.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Pending';
  const receiptLines = [
    'HAND-Philippines',
    'Health Assistance and Network Development',
    'PO Box 85, Augusta, ME 04332 - EIN 46-4698622',
    '',
    'DONATION RECEIPT',
    '',
    `Receipt no: ${donation.donationId || donation._id}`,
    `Date: ${paid}`,
    `Donor: ${donation.isAnonymous ? 'Anonymous' : donation.donorName || donation.donorEmail || 'Donor'}`,
    `Designation: ${donation.impactCategory || 'Projects and Programs'}`,
    `Amount: ${amount} (USD)`,
    `Status: ${normalizeDonationStatus(donation.status)}`,
    '',
    'HAND-Philippines is registered through the IRS as a 501(c)3.',
    'Donations, where allowed, are tax-exempt to the fullest extent',
    'allowed by federal and state law. No goods or services were',
    'provided in exchange for this contribution.',
  ];

  const stream = receiptLines
    .map((line, index) => `BT /F1 11 Tf 72 ${760 - index * 18} Td (${pdfEscape(line)}) Tj ET`)
    .join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

/* ------------------------------------------------------------------ *
 * Stripe webhook application (payment_intent.succeeded etc.)
 * ------------------------------------------------------------------ */
export async function applyStripeEvent(event) {
  const type = event?.type || '';
  const intent = event?.data?.object || {};
  const paymentIntentId = intent.id || '';

  if (type === 'payment_intent.succeeded' || type === 'payment_intent.amount_capturable_updated') {
    const donation = await store.first('Donations', (row) => row.paymentIntentId === paymentIntentId);
    if (!donation) {
      await persistAuditEvent('DONATION_PAYMENT_INTENT_UNMATCHED', { paymentIntentId, stripeEventId: event.id });
      return { applied: false };
    }
    const previous = normalizeDonationStatus(donation.status);
    if (DONATION_SUCCESS_STATUSES.includes(previous)) return { applied: false };

    const updated = await store.update('Donations', {
      ...donation,
      status: 'SUCCEEDED',
      paidAt: new Date().toISOString(),
      stripeEventId: event.id,
      updatedAt: new Date().toISOString(),
    });
    await applySuccessfulTotals(updated);
    await markIslandSlotsPaid(updated).catch(() => {});
    return { applied: true };
  }

  const transitionMap = {
    'payment_intent.processing': 'PROCESSING',
    'payment_intent.payment_failed': 'FAILED',
    'payment_intent.canceled': 'CANCELLED',
  };
  if (transitionMap[type]) {
    const donation = await store.first('Donations', (row) => row.paymentIntentId === paymentIntentId);
    if (!donation) return { applied: false };
    const previous = normalizeDonationStatus(donation.status);
    if (DONATION_SUCCESS_STATUSES.includes(previous)) return { applied: false };
    await store.update('Donations', { ...donation, status: transitionMap[type], updatedAt: new Date().toISOString() });
    return { applied: true };
  }

  if (type === 'charge.refunded') {
    const donation = await store.first(
      'Donations',
      (row) => row.paymentIntentId === (intent.payment_intent || paymentIntentId),
    );
    if (!donation) return { applied: false };
    await store.update('Donations', { ...donation, status: 'REFUNDED', updatedAt: new Date().toISOString() });
    return { applied: true };
  }

  return { applied: false };
}

export { getPublishableKey, getStripeMode, isConfigured };
