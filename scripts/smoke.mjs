/**
 * Compatibility smoke test for the Cloud Run server.
 *
 * Boots `server.js` on a scratch port and exercises the same public surface the
 * SPA and Stripe use, so every migration phase can be verified locally:
 *   - /healthz
 *   - GET  /_functions/programs
 *   - GET  /_functions/campaign?slug=...
 *   - GET  /_functions/islandBoard
 *   - POST /_functions/contactMessage  (valid + invalid)
 *   - POST /_functions/requestDonorOtp
 *
 * Usage:
 *   node scripts/smoke.mjs                 # file store (default)
 *   STORE_DRIVER=firestore node scripts/smoke.mjs   # Firestore (emulator or prod creds)
 *
 * Exits 0 when every assertion passes, 1 otherwise.
 */
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.SMOKE_PORT || 8099);
const BASE = `http://127.0.0.1:${PORT}`;

const results = [];
let failures = 0;

function check(name, condition, detail = '') {
  const ok = Boolean(condition);
  if (!ok) failures += 1;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  return ok;
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, options);
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON (static asset / error page) */
  }
  return { status: response.status, text, json };
}

async function waitForReady(timeoutMs = 30_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      // /health (not /healthz — GCP's frontend intercepts /healthz on Cloud Run).
      const response = await fetch(`${BASE}/health`);
      if (response.ok) return true;
    } catch {
      /* not listening yet */
    }
    await delay(250);
  }
  return false;
}

async function run() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverOutput = '';
  child.stdout.on('data', (chunk) => {
    serverOutput += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    serverOutput += chunk.toString();
  });

  try {
    const ready = await waitForReady();
    if (!check('server boots and /health responds', ready, serverOutput.split('\n')[0] || '')) return;

    const health = await request('/health');
    check('GET /health -> 200 ok', health.status === 200 && health.json?.ok === true, `status=${health.status}`);

    const root = await request('/');
    check('GET / serves the SPA shell', root.status === 200 && /<div id="root"|<html/i.test(root.text), `status=${root.status}`);

    const programs = await request('/_functions/programs');
    check(
      'GET /_functions/programs -> 200 with programs',
      programs.status === 200 && programs.json?.success === true && Array.isArray(programs.json.programs) && programs.json.programs.length > 0,
      `status=${programs.status} count=${programs.json?.programs?.length ?? 0}`,
    );

    const campaign = await request('/_functions/campaign?slug=bayanihan-community-health-reconstruction');
    check(
      'GET /_functions/campaign?slug= -> 200',
      campaign.status === 200 && campaign.json?.success === true && Boolean(campaign.json.campaign),
      `status=${campaign.status}`,
    );

    const board = await request('/_functions/islandBoard');
    check(
      'GET /_functions/islandBoard -> 200 board',
      board.status === 200 && board.json?.ok === true && Array.isArray(board.json.board) && board.json.board.length === 40,
      `status=${board.status} slots=${board.json?.board?.length ?? 0}`,
    );

    const badContact = await request('/_functions/contactMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A', email: 'not-an-email', message: 'short', consent: false }),
    });
    check('POST /_functions/contactMessage invalid -> 400', badContact.status === 400, `status=${badContact.status}`);

    const goodContact = await request('/_functions/contactMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'General Inquiry',
        name: 'Smoke Tester',
        email: `smoke-${Date.now()}@example.com`,
        message: 'Automated compatibility smoke test message.',
        consent: true,
      }),
    });
    check(
      'POST /_functions/contactMessage valid -> 200 success',
      goodContact.status === 200 && goodContact.json?.success === true,
      `status=${goodContact.status}`,
    );

    const otp = await request('/_functions/requestDonorOtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: `smoke-${Date.now()}@example.com`,
        consent: { accepted: true, version: 'smoke-1' },
      }),
    });
    check(
      'POST /_functions/requestDonorOtp -> 200 challenge',
      otp.status === 200 && otp.json?.success === true && Boolean(otp.json.challengeId),
      `status=${otp.status}`,
    );

    const unknown = await request('/_functions/doesNotExist');
    check('unknown endpoint -> 404 JSON', unknown.status === 404 && unknown.json?.success === false, `status=${unknown.status}`);

    /* Concurrency: two simultaneous gifts for the same kit — exactly one wins. */
    const giftBody = JSON.stringify({
      slotIds: ['island-1-1'],
      displayName: 'Smoke Tester',
      email: `island-smoke-${Date.now()}@example.com`,
      firstName: 'Smoke',
      lastName: 'Tester',
    });
    const [giftA, giftB] = await Promise.all([
      request('/_functions/startIslandGift', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: giftBody }),
      request('/_functions/startIslandGift', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: giftBody }),
    ]);
    const winners = [giftA, giftB].filter((response) => response.json?.ok === true);
    check(
      'concurrent startIslandGift on one kit -> exactly one winner',
      winners.length === 1,
      `winners=${winners.length} statuses=${giftA.status}/${giftB.status}`,
    );

    if (winners[0]?.json?.holdId) {
      const release = await request('/_functions/releaseIslandHold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdId: winners[0].json.holdId }),
      });
      check('releaseIslandHold frees the kit', release.json?.released === 1, `status=${release.status}`);
    }
  } finally {
    child.kill();
    await delay(300);
  }
}

run()
  .catch((error) => {
    failures += 1;
    results.push(`FAIL  smoke runner threw — ${error?.message || error}`);
  })
  .then(() => {
    console.log(`\nHAND-Philippines smoke test (STORE_DRIVER=${process.env.STORE_DRIVER || 'file'})`);
    console.log(results.map((line) => `  ${line}`).join('\n'));
    console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}\n`);
    process.exit(failures === 0 ? 0 : 1);
  });
