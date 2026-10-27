/**
 * Google Cloud Run server for the HAND-Philippines React SPA.
 *
 * Serves `./dist` (SPA fallback for deep links) AND the portable
 * `/_functions/*` API — a faithful port of the Wix backend
 * (src/backend/http-functions.js + its service modules, see server/).
 *
 * No web framework: Node's built-in http/fs/crypto, plus the Firestore driver
 * (server/store.firestore.js) when STORE_DRIVER=firestore.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApiRequest } from './server/router.js';
import { ensureSeeded, driverName } from './server/store.js';
import { verifyWebhookSignature, getStripeMode } from './server/stripe.js';
import { applyStripeEvent } from './server/routes/donations.js';
import { markIslandSlotsPaid } from './server/routes/islands.js';
import { persistAuditEvent } from './server/audit.js';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.PORT || 8080);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json; charset=utf-8',
};

/** Resolve a URL pathname to a file under `dist/`, blocking traversal. */
function resolveFilePath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const safe = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const file = join(DIST, safe);
  if (file !== DIST && !file.startsWith(DIST + sep)) return null; // traversal guard
  return file;
}

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function readBody(req, limitBytes = 1_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error('Request body too large.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    /* ---------------- Health check (Cloud Run) ----------------
       /health is the Cloud Run startup-probe path. /healthz is kept as an alias
       for local tooling, but note GCP's frontend intercepts /healthz on Cloud
       Run, so the probe must use /health. */
    if (url.pathname === '/health' || url.pathname === '/healthz') {
      send(res, 200, { 'Content-Type': 'application/json' }, JSON.stringify({ ok: true, status: 'healthy' }));
      return;
    }

    if (url.pathname.startsWith('/_functions/')) {
      const raw = await readBody(req);

      /* The Stripe webhook keeps the raw body for signature verification. */
      if (url.pathname === '/_functions/stripeWebhook' && req.method === 'POST') {
        const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
        const signature = req.headers['stripe-signature'] || '';
        if (!secret || !verifyWebhookSignature(raw.toString('utf8'), signature, secret)) {
          send(res, 400, { 'Content-Type': 'application/json' }, JSON.stringify({ success: false, error: 'Invalid webhook signature.' }));
          return;
        }
        let event = {};
        try {
          event = JSON.parse(raw.toString('utf8'));
        } catch {
          event = {};
        }
        const result = await applyStripeEvent(event);
        await persistAuditEvent('STRIPE_WEBHOOK_APPLIED', { type: event.type, applied: result.applied });
        send(res, 200, { 'Content-Type': 'application/json' }, JSON.stringify({ received: true, ...result }));
        return;
      }

      const response = await handleApiRequest(req, url, raw ? raw.toString('utf8') : '');
      if (response) {
        send(res, response.status, response.headers, response.body);
        return;
      }
    }

    /* ---------------- Static SPA ---------------- */
    let pathname = url.pathname === '/' ? '/index.html' : url.pathname;
    let file = resolveFilePath(pathname);
    let body = null;

    if (file) {
      try {
        body = await readFile(file);
      } catch {
        body = null;
      }
    }

    // SPA fallback: unknown paths serve index.html so client routing handles them.
    if (!body) {
      file = join(DIST, 'index.html');
      body = await readFile(file);
    }

    const ext = extname(file).toLowerCase();
    const isHtml = ext === '.html' || file.endsWith('index.html');
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': isHtml ? 'no-cache' : 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(body);
  } catch (error) {
    console.error('[server]', error);
    send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Server error.');
  }
});

/* Seed the store on boot, then start listening. With the Firestore driver an
   unreachable database is fatal (Cloud Run should restart the revision rather
   than serve traffic with no persistence); the file driver stays best-effort. */
async function start() {
  try {
    await ensureSeeded();
  } catch (error) {
    console.warn('[server] Store seeding failed:', error?.message || error);
    if (driverName === 'firestore') {
      console.error('[server] Fatal: STORE_DRIVER=firestore but Firestore is unreachable. Exiting so Cloud Run can retry.');
      process.exit(1);
    }
  }

  const mode = process.env.STRIPE_SECRET_KEY || process.env.TEST_STRIPE_SECRET_KEY ? getStripeMode() : 'not configured';
  server.listen(PORT, () => {
    console.log(`HAND-Philippines serving ./dist + /_functions on :${PORT} (store: ${driverName}, Stripe: ${mode})`);
  });
}

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled rejection:', reason);
});

start();
