/**
 * Shared validation helpers — port of backend/validation.js.
 */

/** Canonical donation amount rule (mirrors the donate view copy): $0.50 to $10,000. */
export const MIN_DONATION_CENTS = 50;
export const MAX_DONATION_CENTS = 1000000;

/**
 * Converts a dollar amount (number, or a "$1,234.56" style string) to integer
 * cents, rounded to avoid binary float drift. The browser always sends dollars;
 * the conversion lives in backend modules so the cents stored in Donations and
 * the cents sent to Stripe are server-authoritative. NaN when not finite.
 */
export function toDonationCents(value) {
  const cleaned = typeof value === 'string' ? value.replace(/[$,\s]/g, '').trim() : value;
  const dollars = Number(cleaned);
  if (!Number.isFinite(dollars)) return NaN;
  return Math.round(dollars * 100);
}

export function isValidDonationCents(cents) {
  return Number.isSafeInteger(cents) && cents >= MIN_DONATION_CENTS && cents <= MAX_DONATION_CENTS;
}

export function isValidUsdAmount(value) {
  return isValidDonationCents(toDonationCents(value));
}

export function isValidId(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function normalizePhone(value) {
  return typeof value === 'string' ? value.trim() : '';
}
