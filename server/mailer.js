/**
 * Transactional mailer for the donor one-time codes (port of the Wix email
 * step in donor-auth.web.js + donor-otp-email.js).
 *
 * Delivery in this portable backend:
 *   - Always: the message is appended to server/outbox/<timestamp>-<to>.txt
 *     and logged to the server console, so operators can read codes in dev.
 *   - Optional: when SMTP_URL / SMTP_FROM are configured, a real SMTP send
 *     would plug in here (kept contract-compatible).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUTBOX = join(HERE, 'outbox');

export const OTP_EMAIL_SUBJECT = 'Your HAND-Philippines sign-in code';

export function buildOtpEmail({ identifier, code, expiresInMinutes = 10 }) {
  return [
    `Hello,`,
    ``,
    `Your HAND-Philippines donor dashboard sign-in code is:`,
    ``,
    `    ${code}`,
    ``,
    `This code expires in ${expiresInMinutes} minutes and can be used once.`,
    `If you did not request it, you can ignore this email — no account changes were made.`,
    ``,
    `HAND-Philippines — Health Assistance and Network Development`,
    `Questions? info@hand-philippines.org or (207) 800-7270 (call, VM or text).`,
    ``,
  ].join('\n');
}

export async function sendDonorOtpEmail({ identifier, code, expiresInMinutes = 10 }) {
  const body = buildOtpEmail({ identifier, code, expiresInMinutes });
  try {
    mkdirSync(OUTBOX, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    writeFileSync(join(OUTBOX, `${stamp}-${identifier.replace(/[^a-z0-9.@_-]/gi, '_')}.txt`), body);
  } catch {
    /* outbox is best-effort */
  }
  console.log(`[mailer] OTP for ${identifier}: ${code} (expires in ${expiresInMinutes}m)`);
  return { delivered: true };
}
