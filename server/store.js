/**
 * Store facade — picks the active driver once, at import time.
 *
 *   STORE_DRIVER=file       (default) JSON files under server/data/ — local dev
 *   STORE_DRIVER=firestore  Cloud Firestore — Cloud Run production
 *
 * Both drivers export the same async API, so route modules call `store.*` and
 * never reference a driver directly. Switching backends is this single env var.
 *
 * Collections: Programs, Campaigns, Fundraisers, Donations, ContactMessages,
 * Interests, DonorSessions, DonorProfiles, DonorOtpChallenges,
 * FundraiserSessions, FundraiserProfiles, AdminSessions, AuditLog, Users,
 * Settings, IslandSlots, IslandHolds, Refunds.
 */

const requested = String(process.env.STORE_DRIVER || 'file').toLowerCase();
const useFirestore = requested === 'firestore';

const driver = useFirestore ? await import('./store.firestore.js') : await import('./store.file.js');

/** The active driver name, for boot logging and diagnostics. */
export const driverName = useFirestore ? 'firestore' : 'file';

export const flush = driver.flush;
export const newId = driver.newId;
export const insert = driver.insert;
export const update = driver.update;
export const remove = driver.remove;
export const get = driver.get;
export const query = driver.query;
export const first = driver.first;
export const all = driver.all;
export const ensureSeeded = driver.ensureSeeded;
export const runIslandTransaction = driver.runIslandTransaction;
export const SEED_DEFAULT_CAMPAIGN_ID = driver.SEED_DEFAULT_CAMPAIGN_ID;
export const SEED_DEFAULT_FUNDRAISER_ID = driver.SEED_DEFAULT_FUNDRAISER_ID;
