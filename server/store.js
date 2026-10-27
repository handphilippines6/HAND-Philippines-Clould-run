/**
 * File-backed data store for the /_functions API.
 *
 * The Wix backend persists to Wix Data collections; this portable port keeps
 * the same collection names and record shapes in JSON files under
 * `server/data/`, seeded on first run from the approved content layer
 * (src/data/content.js — the same source the Wix CMS was seeded from).
 *
 * Collections (mirroring the Wix project):
 *   Programs, Campaigns, Fundraisers, Donations, ContactMessages, Interests,
 *   DonorSessions, DonorProfiles, DonorOtpChallenges, FundraiserSessions,
 *   FundraiserProfiles, AdminSessions, AuditLog, Users, Settings,
 *   IslandSlots, IslandHolds
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(HERE, 'data');

const memory = new Map();
const dirty = new Set();

function fileFor(collection) {
  return join(DATA_DIR, `${collection}.json`);
}

function readCollection(collection) {
  if (memory.has(collection)) return memory.get(collection);
  const file = fileFor(collection);
  let items = [];
  if (existsSync(file)) {
    try {
      items = JSON.parse(readFileSync(file, 'utf8'));
      if (!Array.isArray(items)) items = [];
    } catch {
      items = [];
    }
  }
  memory.set(collection, items);
  return items;
}

function persist(collection) {
  dirty.add(collection);
}

/** Flush pending writes (called after each request by the router). */
export function flush() {
  if (!dirty.size) return;
  mkdirSync(DATA_DIR, { recursive: true });
  for (const collection of dirty) {
    writeFileSync(fileFor(collection), JSON.stringify(memory.get(collection) ?? [], null, 2));
  }
  dirty.clear();
}

export function newId(prefix = 'rec') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

export function insert(collection, record) {
  const items = readCollection(collection);
  const item = {
    _id: record._id || newId(collection.toLowerCase().replace(/[^a-z]/g, '').slice(0, 6) || 'rec'),
    ...record,
  };
  items.push(item);
  persist(collection);
  return item;
}

export function update(collection, record) {
  const items = readCollection(collection);
  const index = items.findIndex((item) => item._id === record._id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...record };
  persist(collection);
  return items[index];
}

export function remove(collection, id) {
  const items = readCollection(collection);
  const index = items.findIndex((item) => item._id === id);
  if (index === -1) return false;
  items.splice(index, 1);
  persist(collection);
  return true;
}

export function get(collection, id) {
  return readCollection(collection).find((item) => item._id === id) || null;
}

export function query(collection, predicate = () => true) {
  return readCollection(collection).filter((item) => {
    try {
      return predicate(item);
    } catch {
      return false;
    }
  });
}
export function first(collection, predicate) {
  return query(collection, predicate)[0] || null;
}

export function all(collection) {
  return readCollection(collection);
}

/* ------------------------------------------------------------------ *
 * First-run seeding: programs/campaigns/fundraisers from the approved
 * content layer; the default giving campaign + fundraiser ids come from
 * the donate flow (model1 donate-v2).
 * ------------------------------------------------------------------ */
const DEFAULT_CAMPAIGN_ID = '8a7355e6-f001-41fc-a120-0a8ab0ca443a';
const DEFAULT_FUNDRAISER_ID = '75b5b9e4-c999-4eda-836b-c226341afda0';

export async function ensureSeeded() {
  if (existsSync(join(DATA_DIR, 'Programs.json'))) return;

  let programs = [];
  try {
    // Plain ESM data module — single source of truth with the React app.
    const content = await import('../src/data/content.js');
    programs = (content.programs || []).map((program) => ({
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
  }

  if (programs.length) {
    memory.set('Programs', programs);
    persist('Programs');

    // The default giving campaign mirrors the Wix CMS row the donate flow used.
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
    memory.set('Campaigns', [bayanihan]);
    persist('Campaigns');

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
    memory.set('Fundraisers', [fundraiser]);
    persist('Fundraisers');
  }

  // Admin account: seeded from env on first run.
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@hand-philippines.org').toLowerCase();
  const adminPasswordHash = crypto
    .createHash('sha256')
    .update(process.env.ADMIN_PASSWORD || 'hand-admin')
    .digest('hex');
  memory.set('Users', [
    {
      _id: adminEmail,
      email: adminEmail,
      role: 'ADMIN',
      passwordHash: adminPasswordHash,
      createdAt: new Date().toISOString(),
    },
  ]);
  persist('Users');

  flush();
}

