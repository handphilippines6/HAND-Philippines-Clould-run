/**
 * Firestore store driver (Cloud Run production).
 *
 * Drop-in replacement for store.file.js: identical exported function names and
 * record shapes, every method async. Firestore collection = the existing
 * collection name; document id = `_id`; the `_id` field is stored inside each
 * document too so records round-trip byte-for-byte with the file driver.
 *
 * Notes:
 *   - Writes are immediate (no flush phase); `flush()` is a no-op kept for API
 *     compatibility with the router's request lifecycle hook.
 *   - `query()`/`first()`/`all()` read the collection and apply the caller's
 *     predicate in memory. Collection sizes here are small; this avoids
 *     composite indexes while keeping the exact predicate semantics.
 */
import crypto from 'node:crypto';
import { getDb } from './db.js';

function collectionRef(name) {
  return getDb().collection(name);
}

function withId(snapshot) {
  if (!snapshot.exists) return null;
  const data = snapshot.data() || {};
  return { ...data, _id: data._id || snapshot.id };
}

export async function flush() {
  /* Firestore writes are durable on completion — nothing to flush. */
}

export function newId(prefix = 'rec') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

export async function insert(collection, record) {
  const id = record._id || newId(collection.toLowerCase().replace(/[^a-z]/g, '').slice(0, 6) || 'rec');
  const item = { ...record, _id: id };
  await collectionRef(collection).doc(id).set(item);
  return item;
}

export async function update(collection, record) {
  const existing = await get(collection, record._id);
  if (!existing) return null;
  const merged = { ...existing, ...record, _id: record._id };
  await collectionRef(collection).doc(record._id).set(merged, { merge: true });
  return merged;
}

export async function remove(collection, id) {
  const ref = collectionRef(collection).doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) return false;
  await ref.delete();
  return true;
}

export async function get(collection, id) {
  if (id === undefined || id === null || id === '') return null;
  const snapshot = await collectionRef(collection).doc(String(id)).get();
  return withId(snapshot);
}

export async function query(collection, predicate = () => true) {
  const snapshot = await collectionRef(collection).get();
  const items = [];
  snapshot.forEach((doc) => items.push(withId(doc)));
  return items.filter((item) => {
    try {
      return predicate(item);
    } catch {
      return false;
    }
  });
}

export async function first(collection, predicate) {
  return (await query(collection, predicate))[0] || null;
}

export async function all(collection) {
  return query(collection);
}
/* ------------------------------------------------------------------ *
 * First-run seeding — idempotent and cold-start safe.
 *
 * A single `Meta/seeded-v1` document guards the seed inside a transaction, so
 * two Cloud Run instances booting simultaneously cannot double-seed. The seed
 * payload mirrors store.file.js exactly (single source of truth with the React
 * app: src/data/content.js).
 * ------------------------------------------------------------------ */
const SEED_META_PATH = 'Meta/seeded-v1';
const DEFAULT_CAMPAIGN_ID = '8a7355e6-f001-41fc-a120-0a8ab0ca443a';
const DEFAULT_FUNDRAISER_ID = '75b5b9e4-c999-4eda-836b-c226341afda0';

function adminRecord() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@hand-philippines.org').toLowerCase();
  const adminPasswordHash = crypto
    .createHash('sha256')
    .update(process.env.ADMIN_PASSWORD || 'hand-admin')
    .digest('hex');
  return {
    _id: adminEmail,
    email: adminEmail,
    role: 'ADMIN',
    passwordHash: adminPasswordHash,
    createdAt: new Date().toISOString(),
  };
}

async function loadProgramSeeds() {
  try {
    // Plain ESM data module — single source of truth with the React app.
    const content = await import('../src/data/content.js');
    return (content.programs || []).map((program) => ({
      _id: program.slug,
      slug: program.slug,
      title: program.title,
      summary: program.summary,
      cover: program.cover || '',
      body: program.body || [],
      status: 'ACTIVE',
      goalCents: 0,
      raisedCents: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.warn('[store] Could not seed programs from content.js:', error?.message || error);
    return [];
  }
}

export async function ensureSeeded() {
  const db = getDb();
  const programs = await loadProgramSeeds();
  const admin = adminRecord();

  const bayanihan = {
    _id: DEFAULT_CAMPAIGN_ID,
    slug: 'bayanihan-community-health-reconstruction',
    title: 'Bayanihan: Community Health Reconstruction',
    summaryPitch:
      'Rebuild the rural health centers and community systems that typhoons damaged — one barangay at a time.',
    description:
      'Bayanihan means a community carrying a burden together. This fund repairs and equips Rural Health Units, ships biomedical cargo, and keeps community clinics running across the Philippines.',
    status: 'ACTIVE',
    goalCents: 100000000,
    raisedCents: 0,
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const fundraiser = {
    _id: DEFAULT_FUNDRAISER_ID,
    slug: 'hand-philippines',
    name: 'HAND-Philippines',
    email: 'info@hand-philippines.org',
    campaignId: DEFAULT_CAMPAIGN_ID,
    status: 'ACTIVE',
    raisedCents: 0,
    profilePhotoUrl: '',
    story: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.runTransaction(async (tx) => {
    const meta = await tx.get(db.doc(SEED_META_PATH));
    if (meta.exists) return;

    for (const program of programs) {
      tx.set(db.collection('Programs').doc(program._id), program);
    }
    tx.set(db.collection('Campaigns').doc(bayanihan._id), bayanihan);
    tx.set(db.collection('Fundraisers').doc(fundraiser._id), fundraiser);
    tx.set(db.collection('Users').doc(admin._id), admin);
    tx.set(db.doc(SEED_META_PATH), { seededAt: new Date().toISOString(), version: 1 });
  });
}

/** Seed constants shared with the file driver. */
export const SEED_DEFAULT_CAMPAIGN_ID = DEFAULT_CAMPAIGN_ID;
export const SEED_DEFAULT_FUNDRAISER_ID = DEFAULT_FUNDRAISER_ID;

/* ------------------------------------------------------------------ *
 * Adopt-an-Island transactions (Firestore).
 *
 * Firestore requires every read inside a transaction to happen before any
 * write, so the handler's mutations are buffered and applied after it
 * resolves. Concurrent gift attempts on the same slot therefore conflict
 * atomically: one wins, the other sees a non-open slot and is rejected.
 * ------------------------------------------------------------------ */
export function runIslandTransaction(handler) {
  const db = getDb();
  return db.runTransaction(async (tx) => {
    const writes = [];
    const api = {
      getSlot: async (id) => withId(await tx.get(db.collection('IslandSlots').doc(String(id)))),
      querySlots: async (predicate = () => true) => {
        const snapshot = await tx.get(db.collection('IslandSlots'));
        const items = [];
        snapshot.forEach((doc) => items.push(withId(doc)));
        return items.filter((item) => {
          try {
            return predicate(item);
          } catch {
            return false;
          }
        });
      },
      queryHolds: async (predicate = () => true) => {
        const snapshot = await tx.get(db.collection('IslandHolds'));
        const items = [];
        snapshot.forEach((doc) => items.push(withId(doc)));
        return items.filter((item) => {
          try {
            return predicate(item);
          } catch {
            return false;
          }
        });
      },
      updateSlot: (slot) => {
        writes.push(() => tx.set(db.collection('IslandSlots').doc(String(slot._id)), slot));
        return slot;
      },
      insertSlot: (slot) => {
        writes.push(() => tx.set(db.collection('IslandSlots').doc(String(slot._id)), slot));
        return slot;
      },
      insertHold: (hold) => {
        writes.push(() => tx.set(db.collection('IslandHolds').doc(String(hold._id)), hold));
        return hold;
      },
      deleteHold: (id) => {
        writes.push(() => tx.delete(db.collection('IslandHolds').doc(String(id))));
      },
    };
    const result = await handler(api);
    for (const write of writes) write();
    return result;
  });
}

