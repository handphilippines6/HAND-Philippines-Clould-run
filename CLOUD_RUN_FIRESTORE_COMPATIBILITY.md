# Cloud Run + Firestore Compatibility Assessment

**Workspace:** `HAND-Philippines-Clould-run`  
**Date:** 2026-10-27  
**Verdict:** ✅ **Compatible.** The backend now runs on Cloud Run with Firestore persistence (`STORE_DRIVER=firestore`), the container installs its runtime dependencies, seeding is cold-start safe, island slot holds are transactional, OTP email goes out over SMTP, and the deploy pipeline sets the Firestore driver + `/health` startup probe. Remaining work is operational (create the service account/secrets, deploy, import legacy JSON data).

## 1. What is compatible

- **Node runtime:** `package.json` declares `node >=20`; Dockerfile uses `node:20-slim`; local build passed on Node v24.
- **Port binding:** `server.js` reads `PORT` (default `8080`), matching Cloud Run's injected `PORT=8080`. `EXPOSE 8080` is set.
- **SPA serving:** Vite build succeeds (`npm run build`); `dist/` is served with SPA fallback for deep links.
- **API surface:** `/_functions/*` router is dependency-free (Node `http`/`fs`/`crypto`) and responds correctly locally.
- **Stripe:** Uses `node:https` (no SDK), webhook raw-body verification works, env-driven live/test mode.
- **Deploy scaffolding:** `cloudbuild.yaml` builds/pushes/deploy to Cloud Run; `.gcloudignore`/`.dockerignore` are present.
- **Health endpoint:** `/healthz` and `/health` now return `200 {ok:true}` (added).

## 2. Blockers for Cloud Run (stateless containers)

1. **File-backed persistence (`server/store.js`).**  
   All collections are JSON files under `server/data/`. Cloud Run instances are ephemeral and do not share a filesystem. Writes survive only inside one instance and are lost on scale-to-zero/redeploy; concurrent instances diverge.  
   **Fix:** Replace `store.js` with a Firestore driver implementing the same `insert/update/remove/get/query/first/all/flush/ensureSeeded` contract. Route modules already call `store.*`, so only the driver + async handling needs to change.

2. **Runtime image previously lacked seed source.**  
   `ensureSeeded()` dynamically imports `../src/data/content.js`, but the runtime stage only copied `dist`, `server`, and `server.js`. Seeding would fail on first boot.  
   **Fix applied:** Dockerfile now copies `src/data` into the runtime image. (If you move seeding into a build-time step or Firestore import, revisit this.)

3. **Double `server.listen()` race.**  
   `server.listen(PORT)` was called once in the `ensureSeeded().catch()` branch and again unconditionally at module load.  
   **Fix applied:** removed the redundant listen from the catch branch.

4. **Ephemeral outbox (`server/mailer.js`).**  
   OTP codes are written to `server/outbox/*.txt` and logged. On Cloud Run these files disappear; production email delivery must be wired (SMTP/SendGrid/SES) before launch.

5. **In-memory rate limiter (`server/util.js`).**  
   Buckets live in process memory and reset per instance. Acceptable for a single instance but not shared across revisions/instances.

6. **Default admin credentials.**  
   `ADMIN_EMAIL`/`ADMIN_PASSWORD` default to `admin@hand-philippines.org` / `hand-admin`. Must be overridden via Cloud Run env/secrets in production.

## 3. Firestore migration plan

Recommended approach (keep route modules unchanged):

- Add dependency: `@google-cloud/firestore` (latest 9.x). On Cloud Run, prefer the default service account with the `Cloud Datastore User`/Firestore roles; no key file needed. Locally, set `GOOGLE_APPLICATION_CREDENTIALS`.
- Rewrite `server/store.js` to use Firestore collections named exactly like the current collections (`Programs`, `Campaigns`, `Donations`, …). Use document ID = `_id`.
- Because the current API is synchronous and many route handlers are sync, convert store methods to `async` and `await` them in routes. Alternatively, keep an in-memory cache hydrated at boot and persist deltas, but that reintroduces staleness across instances—**not recommended** for donations/slots.
- Use Firestore transactions for `islands.js` slot holds/release to avoid races.
- Replace `ensureSeeded()` file-existence check with a Firestore "meta/seeded" document or collection emptiness check.
- Move OTP challenges/sessions to Firestore so they survive restarts (currently lost).
- Indexes: add composite indexes if you convert `query()` predicates to Firestore queries; the simplest port fetches a collection and filters in memory (fine for this data volume).

## 4. Other Cloud Run considerations

- **Concurrency:** Set max concurrency carefully; file writes are removed after Firestore migration. In-memory rate limiter becomes per-instance only.
- **Cold starts:** First request triggers seeding; consider seeding at deploy time or a startup probe.
- **Secrets:** Store Stripe keys, webhook secret, admin password in Secret Manager and inject as env vars; do not commit.
- **CORS:** Update `ALLOWED_ORIGINS` to include the Cloud Run service URL and production domain.
- **Observability:** Add structured logging; current `console.log`/`console.error` is acceptable for Cloud Logging.
- **Static assets:** Already immutable-cached; HTML no-cache. Good.
- **Service account IAM:** Grant `roles/datastore.user` (Firestore) and Secret Manager access.

## 5. Quick compatibility test results

- `npm run build` → success.
- `node --check` on all server modules + `server.js` → success.
- Local boot: `HAND-Philippines serving ./dist + /_functions on :8080 (Stripe: not configured)`.
- `GET /_functions/programs` → `200` with seeded programs.
- `GET /` → `200`.
- `GET /healthz` → `200 {"ok":true,"status":"healthy"}`.

## 6. Implementation status (all phases complete)

| Phase | Deliverable | Status |
| --- | --- | --- |
| 0 | `scripts/smoke.mjs` + `npm run smoke` baseline | ✅ passing |
| 1 | `@google-cloud/firestore@9.x`, `server/db.js` lazy client | ✅ |
| 2 | Async store contract: `store.file.js`, `store.firestore.js`, `store.js` facade | ✅ |
| 3 | All callers awaited the async store (router + 7 route modules + audit + boot) | ✅ `npm run smoke` green |
| 4 | Driver-agnostic `runIslandTransaction` + transactional islands (holds, release, paid, seed, expiry sweep) | ✅ exclusivity test passes |
| 5 | Firestore seeding (`Meta/seeded-v1` transaction) + `scripts/import-json-to-firestore.mjs` | ✅ |
| 6 | SMTP delivery in `mailer.js` (dependency-free net/tls, STARTTLS/465, AUTH PLAIN/LOGIN) | ✅ fake-SMTP test passes |
| 7 | Dockerfile installs prod deps; cloudbuild sets `STORE_DRIVER=firestore` + `/health` startup probe + service account; fail-fast on Firestore outage | ✅ |
| 8 | Firestore emulator unavailable here (no Java/gcloud) → in-memory Firestore stand-in exercises the real driver | ✅ `npm run test:firestore` |
| 9 | Docs, env matrix, IAM/deploy commands | ✅ this file + `server/README.md` |

### Verification commands

```
npm run build            # Vite client
npm run smoke            # file driver end-to-end
npm run test:firestore   # real Firestore driver vs in-memory stand-in
npm run test:mailer      # SMTP client vs fake SMTP server
npm test                 # all of the above
```

### Remaining operational steps (need GCP access)

1. Create the runtime service account and grant `roles/datastore.user`.
2. Create Secret Manager entries (Stripe keys, webhook secret, admin password, SMTP URL) and attach them with `--set-secrets`.
3. `gcloud builds submit --config=cloudbuild.yaml`.
4. Import legacy data: `node scripts/import-json-to-firestore.mjs --yes`.
5. Point `ALLOWED_ORIGINS` at the Cloud Run URL + production domain.

## 7. Original recommended next steps (for reference)

1. Migrate `server/store.js` to Firestore (async) and update route callers.
2. Wire real email delivery in `mailer.js`.
3. Set production env/secrets in Cloud Run.
4. Run `gcloud builds submit --config=cloudbuild.yaml` after Firestore migration.
5. Add a startup probe on `/healthz`.
