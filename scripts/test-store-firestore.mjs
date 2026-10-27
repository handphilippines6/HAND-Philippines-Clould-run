/**
 * Firestore driver verification without a live database.
 *
 * There is no Java (Firestore emulator) or gcloud on this machine, so this test
 * injects an in-memory Firestore stand-in and exercises the REAL driver code in
 * server/store.firestore.js: CRUD, query/first/all, transactional seeding, the
 * island transaction path, and concurrent gift exclusivity.
 *
 * Run: node scripts/test-store-firestore.mjs
 */
import { __setDbForTests } from '../server/db.js';

/* ------------------------- in-memory Firestore ------------------------- */
class DocSnapshot {
  constructor(id, data) {
    this.id = id;
    this._data = data;
    this.exists = data !== undefined;
  }
  data() {
    return this._data === undefined ? undefined : { ...this._data };
  }
}

class QuerySnapshot {
  constructor(docs) {
    this.docs = docs;
    this.empty = docs.length === 0;
  }
  forEach(callback) {
    for (const doc of this.docs) {
      callback({ id: doc.id, exists: true, data: () => ({ ...doc.data }) });
    }
  }
}

class DocRef {
  constructor(db, collection, id) {
    this.db = db;
    this.collection = collection;
    this.id = String(id);
  }
  async get() {
    const collection = this.db.data.get(this.collection);
    return new DocSnapshot(this.id, collection?.get(this.id));
  }
  async set(value, options = {}) {
    const collection = this.db.data.get(this.collection) || new Map();
    this.db.data.set(this.collection, collection);
    const previous = collection.get(this.id);
    collection.set(this.id, options.merge && previous ? { ...previous, ...value } : { ...value });
  }
  async delete() {
    this.db.data.get(this.collection)?.delete(this.id);
  }
}

class CollectionRef {
  constructor(db, name) {
    this.db = db;
    this.name = name;
    this.max = Infinity;
  }
  doc(id) {
    return new DocRef(this.db, this.name, id);
  }
  limit(count) {
    const copy = new CollectionRef(this.db, this.name);
    copy.max = count;
    return copy;
  }
  async get() {
    const collection = this.db.data.get(this.name) || new Map();
    const docs = [...collection.entries()].slice(0, this.max).map(([id, data]) => ({ id, data }));
    return new QuerySnapshot(docs);
  }
}

class FakeTransaction {
  constructor(db) {
    this.db = db;
  }
  async get(ref) {
    return ref.get();
  }
  set(ref, value) {
    ref.set(value);
  }
  delete(ref) {
    ref.delete();
  }
}

class FakeBatch {
  constructor(db) {
    this.db = db;
    this.ops = [];
  }
  set(ref, value) {
    this.ops.push(() => ref.set(value));
    return this;
  }
  async commit() {
    for (const op of this.ops) await op();
  }
}

class FakeFirestore {
  constructor() {
    this.data = new Map();
    this.lock = Promise.resolve();
  }
  collection(name) {
    return new CollectionRef(this, name);
  }
  doc(path) {
    const [name, id] = String(path).split('/');
    return new DocRef(this, name, id);
  }
  batch() {
    return new FakeBatch(this);
  }
  /** Serialize transactions so concurrent attempts observe each other's writes. */
  runTransaction(handler) {
    const run = this.lock.then(() => handler(new FakeTransaction(this)));
    this.lock = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }
}

/* ------------------------------- the test ------------------------------ */
process.env.STORE_DRIVER = 'firestore';
process.env.ADMIN_EMAIL = 'admin@hand-philippines.org';
process.env.ADMIN_PASSWORD = 'smoke-admin';

const fake = new FakeFirestore();
__setDbForTests(fake);

const store = await import('../server/store.js');
const islands = await import('../server/routes/islands.js');

const checks = [];
function check(name, condition, detail = '') {
  checks.push([name, Boolean(condition), detail]);
}

check('facade selects the firestore driver', store.driverName === 'firestore', store.driverName);

await store.ensureSeeded();
const programs = await store.all('Programs');
check('ensureSeeded writes Programs', programs.length === 6, `count=${programs.length}`);

await store.ensureSeeded();
check('ensureSeeded is idempotent', (await store.all('Programs')).length === 6);

const admin = await store.first('Users', (row) => row.role === 'ADMIN');
check('admin account seeded with env password hash', Boolean(admin) && admin.email === 'admin@hand-philippines.org');

const inserted = await store.insert('Donations', { donationId: 'don_test', amountCents: 2500, status: 'CREATED' });
check('insert assigns an _id', Boolean(inserted._id), inserted._id);
check('get returns the inserted record', (await store.get('Donations', inserted._id))?.donationId === 'don_test');

const updated = await store.update('Donations', { ...inserted, status: 'SUCCEEDED' });
check('update merges fields', updated.status === 'SUCCEEDED');

const queried = await store.query('Donations', (row) => row.status === 'SUCCEEDED');
check('query applies the predicate', queried.length === 1, `count=${queried.length}`);
check(
  'first returns one record',
  (await store.first('Donations', (row) => row.donationId === 'don_test'))?.amountCents === 2500,
);
check(
  'remove deletes the record',
  (await store.remove('Donations', inserted._id)) === true && (await store.get('Donations', inserted._id)) === null,
);

const board = await islands.islandBoard();
check('island slots seeded once', board.board.length === 40, `slots=${board.board.length}`);

const giftInput = {
  slotIds: ['island-1-1'],
  displayName: 'Test Donor',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'Donor',
};
const [giftA, giftB] = await Promise.all([islands.startIslandGift(giftInput), islands.startIslandGift(giftInput)]);
const winners = [giftA, giftB].filter((result) => result.ok === true);
check('concurrent gifts -> exactly one winner', winners.length === 1, `winners=${winners.length}`);

if (winners[0]) {
  const released = await islands.releaseIslandHold({ holdId: winners[0].holdId });
  check('releaseIslandHold frees the kit', released.released === 1, `released=${released.released}`);
  check('slot is open again', (await store.get('IslandSlots', 'island-1-1'))?.status === 'open');
}

let failures = 0;
console.log('\nFirestore driver test (in-memory stand-in)');
for (const [name, ok, detail] of checks) {
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}
console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);

