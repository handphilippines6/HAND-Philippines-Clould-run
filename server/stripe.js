/**
 * Minimal Stripe REST client — same contract as backend/stripeBackend.web.js
 * but dependency-free (node:https + form encoding), so the portable backend
 * keeps the project's zero-runtime-dependency rule.
 *
 * Mode selection mirrors the original: STRIPE_MODE env wins; otherwise live
 * only when BOTH live keys are present and valid, else test.
 */
import https from 'node:https';
import crypto from 'node:crypto';

function readEnv(name) {
  return String(process.env[name] || '').trim();
}

export function getStripeMode() {
  const explicit = readEnv('STRIPE_MODE').toLowerCase();
  if (explicit === 'live' || explicit === 'test') return explicit;
  const liveKey = readEnv('STRIPE_SECRET_KEY');
  const livePub = readEnv('STRIPE_PUBLISHABLE_KEY');
  return /^sk_live_/.test(liveKey) && /^pk_live_/.test(livePub) ? 'live' : 'test';
}

export function getStripeSecretKey() {
  const mode = getStripeMode();
  const secretKey = readEnv(mode === 'live' ? 'STRIPE_SECRET_KEY' : 'TEST_STRIPE_SECRET_KEY');
  return /^sk_(test|live)_/.test(secretKey) ? secretKey : '';
}

export function getPublishableKey() {
  const mode = getStripeMode();
  const key = readEnv(mode === 'live' ? 'STRIPE_PUBLISHABLE_KEY' : 'TEST_STRIPE_PUBLISHABLE_KEY');
  return key;
}

export function isConfigured() {
  return Boolean(getStripeSecretKey());
}

/** URL-encode a flat object the way Stripe expects. */
function encodeForm(payload) {
  const parts = [];
  const walk = (prefix, value) => {
    if (value === null || value === undefined) return;
    if (typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) {
        walk(prefix ? `${prefix}[${key}]` : key, item);
      }
      return;
    }
    parts.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(value))}`);
  };
  walk('', payload);
  return parts.join('&');
}

/**
 * POST/GET to the Stripe API. Resolves the parsed JSON body; rejects with an
 * Error whose message is Stripe's human-readable error when available.
 */
export function stripeRequest(method, path, payload) {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    return Promise.reject(new Error('STRIPE_SECRET_KEY is not configured.'));
  }
  const body = payload ? encodeForm(payload) : null;
  const options = {
    hostname: 'api.stripe.com',
    port: 443,
    path,
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
    },
  };

  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      let raw = '';
      response.on('data', (chunk) => {
        raw += chunk;
      });
      response.on('end', () => {
        let parsed = {};
        try {
          parsed = raw ? JSON.parse(raw) : {};
        } catch {
          parsed = { error: { message: 'Invalid Stripe response.' } };
        }
        if (response.statusCode >= 400) {
          const message = parsed?.error?.message || `Stripe request failed (${response.statusCode}).`;
          reject(new Error(message));
          return;
        }
        resolve(parsed);
      });
    });
    request.on('error', reject);
    if (body) request.write(body);
    request.end();
  });
}

/** Verify a Stripe webhook signature header (t=...,v1=...) against the raw body. */
export function verifyWebhookSignature(rawBody, signatureHeader, secret, toleranceSeconds = 300) {
  if (!signatureHeader || !secret) return false;
  const parts = {};
  for (const segment of String(signatureHeader).split(',')) {
    const [key, value] = segment.split('=');
    if (key && value) parts[key.trim()] = value.trim();
  }
  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  const provided = parts.v1 || '';
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}
