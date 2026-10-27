/**
 * Donor one-time-code sign-in — port of backend/donor-auth.web.js
 * (requestDonorOtp / verifyDonorOtp).
 *
 * Contract (unchanged):
 *   POST /requestDonorOtp { identifier, consent: { accepted, version } }
 *     -> { success, challengeId, delivery: "email", message }
 *     Same answer for a known and an unknown address (no account enumeration).
 *     60s resend cooldown per address, 6-digit code, short TTL, hashed codes.
 *   POST /verifyDonorOtp { challengeId, identifier, otp }
 *     -> { success, sessionKey, expiresAt }
 */
import crypto from 'node:crypto';
import * as store from '../store.js';
import { persistAuditEvent } from '../audit.js';
import { sendDonorOtpEmail } from '../mailer.js';
import { randomToken } from '../util.js';
import { normalizeEmail } from '../validation.js';

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const SESSION_TTL_MS = 1000 * 60 * 30;
const OTP_MAX_ATTEMPTS = 5;
export const CONSENT_VERSION = 'donor-otp-1';

function hashCode(email, code) {
  return crypto.createHash('sha256').update(`${email}:${code}`).digest('hex');
}

function generateOtp() {
  const max = 10 ** OTP_LENGTH;
  return String(crypto.randomInt(0, max)).padStart(OTP_LENGTH, '0');
}

export async function requestDonorOtp(input = {}) {
  const identifier = normalizeEmail(input.identifier);
  const consent = input.consent || {};
  if (!identifier || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
    return { ok: false, error: 'Enter the email address you donated with.' };
  }
  if (consent.accepted !== true) {
    return { ok: false, error: 'Please agree to receive a one-time code by email.' };
  }

  // Resend cooldown: the newest challenge for this address gates a new one.
  const latest = (
    await store.query('DonorOtpChallenges', (row) => row.identifier === identifier)
  ).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))[0];

  if (latest) {
    const elapsed = Date.now() - new Date(latest.createdAt).getTime();
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        cooldownSeconds: Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000),
        error: `Please wait before requesting another code.`,
      };
    }
    // Invalidate the previous challenge for this address.
    await store.remove('DonorOtpChallenges', latest._id);
  }

  const code = generateOtp();
  const challengeId = `otc_${crypto.randomBytes(16).toString('hex')}`;
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  await store.insert('DonorOtpChallenges', {
    _id: challengeId,
    identifier,
    codeHash: hashCode(identifier, code),
    attempts: 0,
    consentVersion: consent.version || CONSENT_VERSION,
    createdAt: new Date().toISOString(),
    expiresAt,
    resendAvailableAt: new Date(Date.now() + OTP_RESEND_COOLDOWN_MS).toISOString(),
  });
  await persistAuditEvent('DONOR_OTP_REQUESTED', { challengeId, identifierHash: identifier.slice(0, 3) + '***' });

  await sendDonorOtpEmail({ identifier, code, expiresInMinutes: OTP_TTL_MS / 60000 });

  // Dev convenience: expose the code only when explicitly allowed.
  const devCode = process.env.ALLOW_TEST_OTP === '1' ? code : undefined;
  return {
    ok: true,
    success: true,
    challengeId,
    delivery: 'email',
    message: `We sent a six-digit code to ${identifier}.`,
    ...(devCode ? { devCode } : {}),
  };
}

export async function verifyDonorOtp(input = {}) {
  const challengeId = String(input.challengeId || '').trim();
  const email = normalizeEmail(input.identifier);
  const code = String(input.otp || '').replace(/\D/g, '');

  if (!challengeId || !email || code.length !== OTP_LENGTH) {
    return { ok: false, error: 'Enter the six-digit code from the email.' };
  }

  const challenge = await store.get('DonorOtpChallenges', challengeId);
  if (!challenge || challenge.identifier !== email) {
    return { ok: false, error: 'That code is invalid or has expired.' };
  }
  if (new Date(challenge.expiresAt) < new Date()) {
    await store.remove('DonorOtpChallenges', challengeId);
    return { ok: false, error: 'That code is invalid or has expired.' };
  }
  if (Number(challenge.attempts || 0) >= OTP_MAX_ATTEMPTS) {
    await store.remove('DonorOtpChallenges', challengeId);
    return { ok: false, error: 'Too many attempts. Please request a new code.' };
  }

  if (challenge.codeHash !== hashCode(email, code)) {
    await store.update('DonorOtpChallenges', { ...challenge, attempts: Number(challenge.attempts || 0) + 1 });
    return { ok: false, error: 'That code is invalid or has expired.' };
  }

  await store.remove('DonorOtpChallenges', challengeId);

  // Ensure a donor profile row exists for the verified address.
  if (!(await store.first('DonorProfiles', (row) => normalizeEmail(row.email) === email))) {
    await store.insert('DonorProfiles', {
      _id: `dp_${randomToken(8)}`,
      email,
      createdAt: new Date().toISOString(),
    });
  }

  const sessionKey = `dsk_${crypto.randomBytes(24).toString('hex')}`;
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await store.insert('DonorSessions', {
    _id: sessionKey,
    donorEmail: email,
    createdAt: new Date().toISOString(),
    expiresAt,
  });
  await persistAuditEvent('DONOR_OTP_VERIFIED', { challengeId, identifierHash: email.slice(0, 3) + '***' });

  return { ok: true, success: true, sessionKey, expiresAt };
}
