/**
 * Adopt an Island endpoints — port of backend/adopt-island.web.js.
 *
 * Collection "IslandSlots": 40 rows (20 communities x 2 slots; slot 1 is the
 * emergency kit, slot 2 the training kit). A gift is one slot ($250) or both
 * slots of one island ($500); slots are held for 15 minutes during checkout
 * and marked paid when the payment clears (markIslandSlotsPaid).
 *
 * Endpoints (unchanged paths + shapes):
 *   GET  /islandBoard                           -> { ok, board: [...] }
 *   POST /startIslandGift | /reserveIslandSlots -> { ok, holdId, amountCents, campaignId }
 *   POST /releaseIslandHold {holdId|paymentIntentId} -> { ok, released }
 */
import * as store from '../store.js';
import { persistAuditEvent } from '../audit.js';
import { ISLANDS } from '../../src/data/islandData.js';

const KIT_PRICE_CENTS = 25000; // $250 per kit (islandData KIT_PRICE)
const HOLD_TTL_MS = 15 * 60 * 1000;

function ensureSlots() {
  if (store.all('IslandSlots').length) return;
  for (const island of ISLANDS) {
    for (const slot of [1, 2]) {
      store.insert('IslandSlots', {
        _id: `island-${island.no}-${slot}`,
        islandNo: island.no,
        island: island.name,
        municipality: island.muni,
        slot,
        status: 'open',
        displayName: '',
        donorEmail: '',
        createdAt: new Date().toISOString(),
      });
    }
  }
  persistAuditEvent('ISLAND_BOARD_SEEDED', { slots: ISLANDS.length * 2 }).catch(() => {});
}

function boardRow(item) {
  return { _id: item._id, islandNo: item.islandNo, slot: item.slot, state: item.status, name: item.displayName || '' };
}

function readSlots(slotIds) {
  const slots = [];
  for (const id of slotIds) {
    const slot = store.get('IslandSlots', String(id));
    if (!slot) return null;
    slots.push(slot);
  }
  if (slots.length === 2 && slots[0].islandNo !== slots[1].islandNo) return null;
  return slots;
}

function claimSlots(slotIds, buildUpdate) {
  const claimed = [];
  for (const id of slotIds) {
    const slot = store.get('IslandSlots', String(id));
    if (!slot || slot.status !== 'open') {
      for (const claimedSlot of claimed) {
        store.update('IslandSlots', { ...claimedSlot, status: 'open', displayName: '', donorEmail: '', holdExpiresAt: null });
      }
      persistAuditEvent('ISLAND_SLOT_CONFLICT', { slotIds, taken: String(id) }).catch(() => {});
      return null;
    }
    claimed.push(store.update('IslandSlots', { ...slot, ...buildUpdate(slot) }));
  }
  return claimed;
}

export function islandBoard() {
  ensureSlots();
  return {
    ok: true,
    success: true,
    board: store
      .all('IslandSlots')
      .sort((a, b) => a.islandNo - b.islandNo || a.slot - b.slot)
      .map(boardRow),
  };
}

function cleanName(value) {
  return typeof value === 'string' ? value.trim().slice(0, 80) : '';
}

function checkInput(slotIds, name, email, firstName, lastName) {
  if (!Array.isArray(slotIds) || slotIds.length < 1 || slotIds.length > 2) return 'Pick one or two kits.';
  if (!cleanName(name)) return 'Please share the name to display.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim().toLowerCase())) {
    return 'A valid email address is required.';
  }
  if (!cleanName(firstName) || !cleanName(lastName)) return 'Please share the donor name for the receipt.';
  return '';
}

export function startIslandGift(input = {}) {
  ensureSlots();
  const slotIds = Array.isArray(input.slotIds) ? input.slotIds.map(String) : [];
  const name = cleanName(input.displayName);
  const email = String(input.email || '').trim().toLowerCase();
  const firstName = cleanName(input.firstName);
  const lastName = cleanName(input.lastName);

  const problem = checkInput(slotIds, name, email, firstName, lastName);
  if (problem) return { ok: false, success: false, message: problem };

  const selection = readSlots(slotIds);
  if (!selection) return { ok: false, success: false, message: 'Pick one kit, or both kits of the same island.' };
  if (selection.some((slot) => slot.status !== 'open')) {
    return { ok: false, success: false, message: 'That kit was just taken. Please pick another.' };
  }

  const claimed = claimSlots(slotIds, (slot) => ({
    status: 'held',
    displayName: name,
    donorEmail: email,
    holdExpiresAt: new Date(Date.now() + HOLD_TTL_MS).toISOString(),
  }));
  if (!claimed) return { ok: false, success: false, message: 'That kit was just taken. Please pick another.' };

  const amountCents = selection.length * KIT_PRICE_CENTS;
  const hold = store.insert('IslandHolds', {
    slotIds,
    email,
    displayName: name,
    firstName,
    lastName,
    amountCents,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + HOLD_TTL_MS).toISOString(),
  });

  return {
    ok: true,
    success: true,
    holdId: hold._id,
    amountCents,
    campaignId: 'vela-neonatal-resuscitation',
    message: `Holding ${selection.length} kit${selection.length === 1 ? '' : 's'} for 15 minutes.`,
  };
}

export function reserveIslandSlots(input = {}) {
  return startIslandGift(input);
}

export function releaseIslandHold(input = {}) {
  const paymentIntentId = String(input.paymentIntentId || '').trim();
  const holdId = String(input.holdId || '').trim();
  const holds = store.query(
    'IslandHolds',
    (row) => (holdId && row._id === holdId) || (!holdId && paymentIntentId && row.paymentIntentId === paymentIntentId),
  );
  for (const hold of holds) {
    for (const slotId of hold.slotIds || []) {
      const slot = store.get('IslandSlots', String(slotId));
      if (slot && slot.status === 'held') {
        store.update('IslandSlots', { ...slot, status: 'open', displayName: '', donorEmail: '', holdExpiresAt: null });
      }
    }
    store.remove('IslandHolds', hold._id);
  }
  return { ok: true, success: true, released: holds.length };
}

/** Webhook hook: mark matching held slots paid when the payment clears. */
export function markIslandSlotsPaid(donation) {
  const holds = store.query('IslandHolds', (row) => row.paymentIntentId === donation.paymentIntentId);
  for (const hold of holds) {
    for (const slotId of hold.slotIds || []) {
      const slot = store.get('IslandSlots', String(slotId));
      if (slot) {
        store.update('IslandSlots', {
          ...slot,
          status: 'paid',
          displayName: hold.displayName || slot.displayName,
          donorEmail: hold.email || slot.donorEmail,
          holdExpiresAt: null,
        });
      }
    }
    store.remove('IslandHolds', hold._id);
  }
  return { marked: holds.length };
}

