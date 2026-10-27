/**
 * Shared HTTP + security helpers for the /_functions API (port of the Wix
 * http-functions transport layer: CORS, origin allow-list, JSON bodies,
 * responses, rate limiting, and small crypto helpers).
 */
import crypto from 'node:crypto';

/** Allowed origins: same-origin requests (no Origin header) always pass. */
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS ||
    'https://www.hand-philippines.org,https://www.hand-philippines.org/test-v2,http://localhost:5173,http://localhost:4173,http://localhost:8080')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);

export function getOrigin(request) {
  const origin = request.headers?.origin || request.headers?.Origin || '';
  return typeof origin === 'string' ? origin.trim() : '';
}

export function corsHeaders(origin) {
  const headers = {
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '600',
    'Cache-Control': 'no-store',
  };
  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

export function isOriginAllowed(origin) {
  if (!origin) return true; // same-origin / server-to-server
  const normalized = String(origin).trim().toLowerCase().replace(/\/$/, '');
  if (ALLOWED_ORIGINS.has(normalized)) return true;
  // Any subdomain path variant of the configured site (e.g. /test-v2 previews).
  try {
    const host = new URL(normalized).host;
    if (host === 'www.hand-philippines.org') return true;
  } catch {
    /* not a URL — treat as disallowed */
  }
  return false;
}

export function json(request, body, status = 200, extraHeaders = {}) {
  const origin = getOrigin(request);
  return {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin), ...extraHeaders },
    body: JSON.stringify(body),
  };
}

export const noContent = (request) => ({
  status: 204,
  headers: corsHeaders(getOrigin(request)),
  body: '',
});

export const badRequest = ({ headers = {}, body }) => ({ status: 400, headers, body: JSON.stringify(body) });
export const unauthorized = ({ headers = {}, body }) => ({ status: 401, headers, body: JSON.stringify(body) });
export const forbidden = ({ headers = {}, body }) => ({ status: 403, headers, body: JSON.stringify(body) });
export const notFound = ({ headers = {}, body }) => ({ status: 404, headers, body: JSON.stringify(body) });
export const serverError = ({ headers = {}, body }) => ({ status: 500, headers, body: JSON.stringify(body) });

export function getJsonBody(rawBody) {
  if (!rawBody) return null;
  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

export function getClientIp(request) {
  const forwarded = request.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return request.socket?.remoteAddress || '';
}

export function hashForAudit(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex').slice(0, 32);
}

export function bearerToken(request) {
  const header = request.headers?.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : '';
}

export function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function generateDonationId() {
  return `don_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

/* ------------------------------------------------------------------ *
 * Rate limiting (doc 07 §5): in-memory sliding buckets, keyed per lane
 * + hashed client identity. Storage failures never block a request.
 * ------------------------------------------------------------------ */
const buckets = new Map();

export const RATE_LIMITS = {
  DONATION_INTENT: { windowMs: 60_000, max: 10 },
  CONTACT_MESSAGE: { windowMs: 60_000, max: 5 },
  DONOR_OTP: { windowMs: 60_000, max: 3 },
  FUNDRAISER_LOGIN: { windowMs: 60_000, max: 5 },
};

export async function consumeRateLimit(lane, identity) {
  const limit = RATE_LIMITS[lane] || { windowMs: 60_000, max: 20 };
  const now = Date.now();
  const key = `${lane}:${identity || 'unknown'}`;
  const bucket = buckets.get(key) || { hits: [] };
  bucket.hits = bucket.hits.filter((ts) => now - ts < limit.windowMs);
  if (bucket.hits.length >= limit.max) {
    const oldest = bucket.hits[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((limit.windowMs - (now - oldest)) / 1000));
    buckets.set(key, bucket);
    return { evaluation: { allowed: false, retryAfterSeconds } };
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { evaluation: { allowed: true, retryAfterSeconds: 0 } };
}
