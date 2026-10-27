# HAND-Philippines — Cloud Run + Firestore

React SPA (Vite + React Router) with the portable `/_functions/*` backend served
by `server.js`, deployable to Google Cloud Run with Cloud Firestore persistence.

## Quick start (local, file-backed)

```
npm ci
npm run build
npm run dev      # Vite dev server
npm start        # http://localhost:8080 — SPA + /_functions API (file store)
npm test         # smoke + Firestore-driver + SMTP checks
```

## Production (Cloud Run + Firestore)

- `STORE_DRIVER=firestore` switches persistence to Cloud Firestore (see
  `server/README.md` for env vars, seeding, IAM, and deploy commands).
- `gcloud builds submit --config=cloudbuild.yaml` builds the image and deploys
  with the Firestore driver and a `/health` startup probe.
- Migration and compatibility notes: `CLOUD_RUN_FIRESTORE_COMPATIBILITY.md`.
- Import existing JSON data: `node scripts/import-json-to-firestore.mjs --yes`.

