# HAND-Philippines portable backend (`server/`)

Node-only port of the Wix backend (`HandPH2/src/backend/*`) mounted inside the
same server that serves the built SPA (`server.js`). Same endpoints, same
request/response contracts, same security posture — no framework, no runtime
dependencies beyond Node's standard library.

## Layout

| File | Purpose | Ported from |
| --- | --- | --- |
| `server.js` (repo root) | Entry: serves `dist/` (SPA fallback) + dispatches `/_functions/*` + verifies the Stripe webhook | — |
| `router.js` | Endpoint table: method + path → handler, CORS, OPTIONS, rate limits, bearer checks | `http-functions.js` transport layer |
| `store.js` | Driver facade: `STORE_DRIVER=file` (default) or `firestore`; re-exports one async API | Wix Data collections |
| `store.file.js` | File-backed JSON collections in `server/data/`, seeded on first boot from `src/data/content.js` | Wix Data collections |
| `store.firestore.js` | Firestore-backed driver (doc id = `_id`), transactional `ensureSeeded` + island transactions | Wix Data collections |
| `db.js` | Lazy Firestore client (ADC / emulator / key file) | — |
| `util.js` | Responses, CORS + origin allow-list, JSON bodies, rate limiting, crypto helpers | `http-functions.js` helpers |
| `canonical.js` | Status vocabulary + legacy field fallbacks | `canonical.js` |
| `validation.js` | Donation amount bounds, email/phone normalization | `validation.js` |
| `contact-intake.js` | Contact/interest intake validation + generic copy | `contact-intake.js` |
| `audit.js` | Append-only audit events | `audit.js` |
| `mailer.js` | Donor one-time-code email (console + `server/outbox/*.txt`) | donor-otp-email.js |
| `stripe.js` | Minimal Stripe REST client (form-encoded `node:https`) + webhook signature verification + live/test mode selection | `stripeBackend.web.js` |
| `routes/donations.js` | createPaymentIntent, updateDonationStatus, createDonationSessionKey, verifyDonationSession, donationReceipt (dependency-free PDF), Stripe event application | stripeBackend/DonationService |
| `routes/otp.js` | requestDonorOtp / verifyDonorOtp (6-digit, 60s cooldown, hashed codes, attempt limits) | donor-auth.web.js |
| `routes/contact.js` | POST contactMessage (contact + interest lanes) | contact-intake.js |
| `routes/content.js` | programs / program / campaign / donors / fundraiser / fundraiserDonors | http-functions.js |
| `routes/fundraisers.js` | fundraiserLogin / verifyFundraiserSession / updateFundraiserSettings | http-functions.js |
| `routes/admin.js` | admin sessions + overview/sections + adminRefund + adminInterestStatus | admin.web.js |
| `routes/islands.js` | Adopt an Island board / gift holds / release / paid-marking | adopt-island.web.js |

## Endpoints (identical paths to the Wix deployment)

```
GET  /_functions/programs                    GET  /_functions/program?slug=
GET  /_functions/campaign?id=|slug=          GET  /_functions/donors?campaign=
GET  /_functions/fundraiser?slug=            GET  /_functions/fundraiserDonors?slug=
GET  /_functions/stripePublishableKey        POST /_functions/createPaymentIntent
POST /_functions/updateDonationStatus        POST /_functions/createDonationSessionKey
POST /_functions/verifyDonationSession       GET  /_functions/donationReceipt?id=
GET  /_functions/donationStatus?id=          POST /_functions/contactMessage
POST /_functions/requestDonorOtp             POST /_functions/verifyDonorOtp
GET  /_functions/getCurrentWixMember         POST /_functions/createSessionFromWixMember
POST /_functions/fundraiserLogin             POST /_functions/verifyFundraiserSession
POST /_functions/updateFundraiserSettings    POST /_functions/stripeWebhook
GET  /_functions/currentAdmin                POST /_functions/adminLogin
POST /_functions/verifyAdminSession          POST /_functions/adminLogout
GET  /_functions/adminOverview               GET  /_functions/adminDonations
GET  /_functions/adminCampaigns              GET  /_functions/adminFundraisers
GET  /_functions/adminContent                GET  /_functions/adminUsers
GET  /_functions/adminSettings               GET  /_functions/adminAuditLog
GET  /_functions/adminInterests              POST /_functions/adminRefund
POST /_functions/adminInterestStatus
GET  /_functions/islandBoard                 POST /_functions/startIslandGift
POST /_functions/reserveIslandSlots          POST /_functions/releaseIslandHold
```

## Environment

| Variable | Purpose |
| --- | --- |
| `PORT` | Server port (default 8080; Cloud Run injects 8080). |
| `STORE_DRIVER` | `file` (default, local dev) or `firestore` (Cloud Run production). |
| `FIRESTORE_PROJECT_ID` / `GOOGLE_CLOUD_PROJECT` | Firestore project (auto-detected on Cloud Run). |
| `FIRESTORE_DATABASE_ID` | Optional non-default Firestore database. |
| `FIRESTORE_EMULATOR_HOST` | Local emulator endpoint (e.g. `localhost:8088`). |
| `GOOGLE_APPLICATION_CREDENTIALS` | Service-account key path for local runs against a real project. |
| `ALLOWED_ORIGINS` | Comma-separated CORS allow-list (published site + Cloud Run URL + local dev). |
| `TEST_STRIPE_SECRET_KEY` / `STRIPE_SECRET_KEY` | Stripe secret keys. Mode selection mirrors the original: `STRIPE_MODE` wins; otherwise live only when both live keys are valid, else test. |
| `TEST_STRIPE_PUBLISHABLE_KEY` / `STRIPE_PUBLISHABLE_KEY` | Publishable keys served by `stripePublishableKey`. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `POST /_functions/stripeWebhook`. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Seeds the admin account on first boot (defaults `admin@hand-philippines.org` / `hand-admin` — must be overridden in production). |
| `ALLOW_TEST_OTP` | `1` exposes the OTP code in the response for automated testing only. |
| `SMTP_URL` | `smtp://user:pass@host:587` or `smtps://user:pass@host:465` — delivers donor OTP email. |
| `SMTP_FROM`, `SMTP_HELO` | Optional From header and EHLO name for SMTP. |

## Storage

`STORE_DRIVER` selects the backend; route modules never know which one is active.

- **`file`** (default) — JSON collections in `server/data/`, seeded on first boot
  from `src/data/content.js`. Writes are flushed after each request. This is the
  local/dev driver; Cloud Run's filesystem is ephemeral, so do not use it there.
- **`firestore`** — Cloud Firestore, collection per collection name, document id
  = `_id`. Seeding is guarded by a `Meta/seeded-v1` document inside a transaction
  (cold-start safe), and island slot holds/releases run in Firestore transactions
  so concurrent gifts cannot double-sell a kit.

Every store method is async. Switching backends is the single `STORE_DRIVER`
env var — no route changes.

### Migrating existing JSON data

```
node scripts/import-json-to-firestore.mjs          # dry run (counts only)
node scripts/import-json-to-firestore.mjs --yes    # write (skips non-empty collections)
```

### Email delivery

`mailer.js` sends the donor one-time code over SMTP when `SMTP_URL` is set
(dependency-free `net`/`tls` client: STARTTLS on 587, implicit TLS on 465, AUTH
PLAIN/LOGIN). In development without `SMTP_URL` it writes `server/outbox/*.txt`
and logs the code; in production without `SMTP_URL` it logs a delivery failure
and never writes the code to disk or logs.

### Rate limiting

The per-lane limiter in `util.js` is in-process (per Cloud Run instance), not
shared. This is an accepted trade-off for the current traffic level; move it to
Firestore or Cloud Armor if you need global limits.

## Tests

| Command | Covers |
| --- | --- |
| `npm run smoke` | Boots the server (file driver) and checks health, SPA shell, content, contact, OTP, island board, concurrent gift exclusivity, unknown endpoint. |
| `npm run test:firestore` | Exercises the real Firestore driver against an in-memory stand-in (CRUD, seeding, transactions). |
| `npm run test:mailer` | Exercises the SMTP client against a fake SMTP server. |
| `npm test` | All three. |

## Deploying to Cloud Run

```
# one-time: dedicated runtime service account with Firestore access
gcloud iam service-accounts create hand-philippines-web --display-name="HAND-Philippines Cloud Run"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:hand-philippines-web@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

# build + deploy (sets STORE_DRIVER=firestore and the /health startup probe)
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=hand-philippines-web,_REGION=us-central1

# secrets (kept out of cloudbuild.yaml)
gcloud run services update hand-philippines-web --region=us-central1 \
  --set-secrets STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest,ADMIN_PASSWORD=admin-password:latest
```

The startup probe uses `/health` (not `/healthz`, which GCP's frontend
intercepts). With `STORE_DRIVER=firestore`, an unreachable Firestore makes the
boot fail fast so Cloud Run restarts the revision instead of serving traffic
without persistence.
