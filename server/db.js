/**
 * Firestore client factory for the Cloud Run runtime.
 *
 * Credentials resolution (no key files in the repo):
 *   - Cloud Run / GCE: Application Default Credentials from the attached
 *     service account (grant it roles/datastore.user).
 *   - Local emulator: set FIRESTORE_EMULATOR_HOST (e.g. localhost:8088); the
 *     SDK picks it up automatically. A demo project id is supplied when the
 *     project is not otherwise configured.
 *   - Local against a real project: set GOOGLE_APPLICATION_CREDENTIALS.
 *
 * The client is created lazily so importing this module never throws — only the
 * first real operation surfaces configuration problems.
 */
import { Firestore } from '@google-cloud/firestore';

let client = null;

function resolveProjectId() {
  const explicit = process.env.FIRESTORE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  if (explicit) return explicit;
  // The emulator accepts any project id; keep a stable demo one for tests.
  if (process.env.FIRESTORE_EMULATOR_HOST) return 'demo-hand-philippines';
  return undefined;
}

/** True when the runtime is expected to talk to Firestore. */
export function isFirestoreEnabled() {
  return String(process.env.STORE_DRIVER || '').toLowerCase() === 'firestore';
}

/** Lazily create (and memoize) the Firestore client. */
export function getDb() {
  if (client) return client;
  const projectId = resolveProjectId();
  const databaseId = process.env.FIRESTORE_DATABASE_ID || undefined;
  client = new Firestore({
    ...(projectId ? { projectId } : {}),
    ...(databaseId ? { databaseId } : {}),
    // Records legitimately contain optional/undefined fields (e.g. holdExpiresAt).
    ignoreUndefinedProperties: true,
  });
  return client;
}

/**
 * Test-only hook: inject an in-memory Firestore stand-in so the Firestore
 * driver can be exercised without credentials or the emulator. Never call this
 * from application code.
 */
export function __setDbForTests(fakeClient) {
  client = fakeClient;
}

