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
| `store.js` | File-backed JSON collections in `server/data/`, seeded on first boot from `src/data/content.js` (single source of truth with the React app) | Wix Data collections |
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
| `ALLOWED_ORIGINS` | Comma-separated CORS allow-list (the published site + local dev). |
| `TEST_STRIPE_SECRET_KEY` / `STRIPE_SECRET_KEY` | Stripe secret keys. Mode selection mirrors the original: `STRIPE_MODE` wins; otherwise live only when both live keys are valid, else test. |
| `TEST_STRIPE_PUBLISHABLE_KEY` / `STRIPE_PUBLISHABLE_KEY` | Publishable keys served by `stripePublishableKey`. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `POST /_functions/stripeWebhook`. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Seeds the admin account on first boot (defaults `admin@hand-philippines.org` / `hand-admin` — change in production). |
| `ALLOW_TEST_OTP` | `1` exposes the OTP code in the response for automated testing only. |

## Storage

First boot seeds `server/data/` (Programs, Campaigns, Fundraisers, Users).
Every mutation writes through to JSON files — swap `store.js` for a database
driver to move beyond file storage without touching the route modules.

Donor OTP codes are written to `server/outbox/` and logged; wire a real SMTP
transport in `mailer.js` to deliver them by email in production.
