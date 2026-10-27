/**
 * One-shot importer: copies the legacy file store (server/data/*.json) into
 * Firestore so no history is lost when STORE_DRIVER=firestore goes live.
 *
 * Usage (from the repo root):
 *   node scripts/import-json-to-firestore.mjs            # dry run, lists counts
 *   node scripts/import-json-to-firestore.mjs --yes      # writes to Firestore
 *   node scripts/import-json-to-firestore.mjs --yes --force
 *   node scripts/import-json-to-firestore.mjs --yes --only=Donations,Campaigns
 *
 * Safety:
 *   - Dry run by default; nothing is written without --yes.
 *   - Refuses to write into a non-empty collection unless --force is passed.
 *   - Batches writes in chunks of 400 (under Firestore's 500 limit).
 *
 * Credentials: same resolution as the runtime (server/db.js) — ADC on Cloud Run
 * or GOOGLE_APPLICATION_CREDENTIALS / FIRESTORE_EMULATOR_HOST locally.
 */
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from '../server/db.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'server', 'data');
const BATCH_LIMIT = 400;

const args = process.argv.slice(2);
const apply = args.includes('--yes');
const force = args.includes('--force');
const onlyArg = args.find((arg) => arg.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((value) => value.trim())) : null;

async function listCollections() {
  const files = await readdir(DATA_DIR);
  return files
    .filter((file) => file.endsWith('.json'))
    .map((file) => ({ collection: file.replace(/\.json$/, ''), file: join(DATA_DIR, file) }))
    .filter((entry) => !only || only.has(entry.collection));
}

async function readRecords(file) {
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function main() {
  const db = getDb();
  const collections = await listCollections();
  if (!collections.length) {
    console.log('No JSON collections found in server/data/.');
    return;
  }

  console.log(`${apply ? 'IMPORTING' : 'DRY RUN'} — ${collections.length} collection file(s)${force ? ' (force)' : ''}\n`);
  let totalWritten = 0;

  for (const { collection, file } of collections) {
    const records = await readRecords(file);
    if (!records.length) {
      console.log(`- ${collection}: empty, skipped`);
      continue;
    }

    if (!apply) {
      console.log(`- ${collection}: ${records.length} record(s) — would write (dry run, Firestore not contacted)`);
      totalWritten += records.length;
      continue;
    }

    const existing = await db.collection(collection).limit(1).get();
    if (!existing.empty && !force) {
      console.log(`- ${collection}: ${records.length} record(s) — SKIPPED (collection not empty; use --force)`);
      continue;
    }
    if (!existing.empty && force) {
      console.log(`- ${collection}: ${records.length} record(s) — writing on top of existing data (--force)`);
    }

    let written = 0;
    for (let index = 0; index < records.length; index += BATCH_LIMIT) {
      const batch = db.batch();
      for (const record of records.slice(index, index + BATCH_LIMIT)) {
        const id = record._id || `${collection}_${written + 1}`;
        batch.set(db.collection(collection).doc(String(id)), { ...record, _id: id });
        written += 1;
      }
      await batch.commit();
    }
    totalWritten += written;
    console.log(`- ${collection}: wrote ${written} record(s)`);
  }

  console.log(`\n${apply ? `Done — ${totalWritten} record(s) written.` : `Dry run complete — ${totalWritten} record(s) would be written. Re-run with --yes to apply.`}`);
}

main().catch((error) => {
  console.error('[import] Failed:', error?.message || error);
  process.exit(1);
});
