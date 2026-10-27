/**
 * Adopt an Island endpoints — port of backend/adopt-island.web.js.
 *
 * Collection "IslandSlots": 40 rows (20 communities x 2 slots; slot 1 is the
 * emergency kit, slot 2 the training kit). A gift is one slot ($250) or both
 * slots of one island ($500); slots are held for 15 minutes during checkout
 * and marked paid when the payment clears (markIslandSlotsPaid).
 *
 * All slot/hold mutations run through store.runIslandTransaction, so concurrent
 * gift attempts on the same kit conflict atomically (one wins, the other sees a
 * non-open slot) on both the Firestore and file drivers.
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

function slotRecord(island, slot) {
  return {
    _id: `island-${island.no}-${slot}`,
    islandNo: island.no,
    island: island.name,
    municipality: island.muni,
    slot,
    status: 'open',
    displayName: '',
    donorEmail: '',
    createdAt: new Date().toISOString(),
  };
}

/** Seed the 40 kit slots exactly once, even under concurrent cold starts. */
async function seedSlotsIfEmpty() {
  const seeded = await store.runIslandTransaction(async (tx) => {
    const existing = await tx.querySlots();
    if (existing.length) return false;
    for (const island of ISLANDS) {
      for (const slot of [1, 2]) {
        tx.insertSlot(slotRecord(island, slot));
      }
    }
    return true;
  });
  if (seeded) persistAuditEvent('ISLAND_BOARD_SEEDED', { slots: ISLANDS.length * 2 }).catch(() => {});
}

/** Release holds whose 15-minute window has elapsed (lazy sweep). */
async function sweepExpiredHolds() {
  const now = Date.now();
  try {
    await store.runIslandTransaction(async (tx) => {
      const holds = await tx.queryHolds((row) => row.expiresAt && new Date(row.expiresAt).getTime() < now);
      for (const hold of holds) {
        for (const slotId of hold.slotIds || []) {
          const slot = await tx.getSlot(slotId);
          if (slot && slot.status === 'held') {
            tx.updateSlot({ ...slot, status: 'open', displayName: '', donorEmail: '', holdExpiresAt: null });
          }
        }
        tx.deleteHold(hold._id);
      }
    });
  } catch (error) {
    console.warn('[islands] Expired-hold sweep failed:', error?.message || error);
  }
}

function boardRow(item) {
  return { _id: item._id, islandNo: item.islandNo, slot: item.slot, state: item.status, name: item.displayName || '' };
}

export async function islandBoard() {
  await seedSlotsIfEmpty();
  await sweepExpiredHolds();
  const slots = await store.all('IslandSlots');
  return {
    ok: true,
    success: true,
    board: slots.sort((a, b) => a.islandNo - b.islandNo || a.slot - b.slot).map(boardRow),
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

export async function startIslandGift(input = {}) {
  await seedSlotsIfEmpty();
  const slotIds = Array.isArray(input.slotIds) ? input.slotIds.map(String) : [];
  const name = cleanName(input.displayName);
  const email = String(input.email || '').trim().toLowerCase();
  const firstName = cleanName(input.firstName);
  const lastName = cleanName(input.lastName);

  const problem = checkInput(slotIds, name, email, firstName, lastName);
  if (problem) return { ok: false, success: false, message: problem };

  const holdId = store.newId('hold');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + HOLD_TTL_MS).toISOString();

  const outcome = await store.runIslandTransaction(async (tx) => {
    const selection = [];
    for (const id of slotIds) {
      const slot = await tx.getSlot(id);
      if (!slot) return { ok: false, message: 'Pick one kit, or both kits of the same island.' };
      selection.push(slot);
    }
    if (selection.length === 2 && selection[0].islandNo !== selection[1].islandNo) {
      return { ok: false, message: 'Pick one kit, or both kits of the same island.' };
    }
    const taken = selection.find((slot) => slot.status !== 'open');
    if (taken) return { ok: false, conflict: true, message: 'That kit was just taken. Please pick another.' };

    for (const slot of selection) {
      tx.updateSlot({ ...slot, status: 'held', displayName: name, donorEmail: email, holdExpiresAt: expiresAt });
    }
    const amountCents = selection.length * KIT_PRICE_CENTS;
    tx.insertHold({
      _id: holdId,
      slotIds,
      email,
      displayName: name,
      firstName,
      lastName,
      amountCents,
      createdAt: now.toISOString(),
      expiresAt,
    });
    return { ok: true, count: selection.length, amountCents };
  });

  if (!outcome.ok) {
    if (outcome.conflict) persistAuditEvent('ISLAND_SLOT_CONFLICT', { slotIds }).catch(() => {});
    return { ok: false, success: false, message: outcome.message };
  }

  return {
    ok: true,
    success: true,
    holdId,
    amountCents: outcome.amountCents,
    campaignId: 'vela-neonatal-resuscitation',
    message: `Holding ${outcome.count} kit${outcome.count === 1 ? '' : 's'} for 15 minutes.`,
  };
}

export async function reserveIslandSlots(input = {}) {
  return startIslandGift(input);
}

export async function releaseIslandHold(input = {}) {
  const paymentIntentId = String(input.paymentIntentId || '').trim();
  const holdId = String(input.holdId || '').trim();

  const released = await store.runIslandTransaction(async (tx) => {
    const holds = await tx.queryHolds(
      (row) => (holdId && row._id === holdId) || (!holdId && paymentIntentId && row.paymentIntentId === paymentIntentId),
    );
    for (const hold of holds) {
      for (const slotId of hold.slotIds || []) {
        const slot = await tx.getSlot(slotId);
        if (slot && slot.status === 'held') {
          tx.updateSlot({ ...slot, status: 'open', displayName: '', donorEmail: '', holdExpiresAt: null });
        }
      }
      tx.deleteHold(hold._id);
    }
    return holds.length;
  });

  return { ok: true, success: true, released };
}

/** Webhook hook: mark matching held slots paid when the payment clears. */
export async function markIslandSlotsPaid(donation) {
  const marked = await store.runIslandTransaction(async (tx) => {
    const holds = await tx.queryHolds((row) => row.paymentIntentId === donation.paymentIntentId);
    for (const hold of holds) {
      for (const slotId of hold.slotIds || []) {
        const slot = await tx.getSlot(slotId);
        if (slot) {
          tx.updateSlot({
            ...slot,
            status: 'paid',
            displayName: hold.displayName || slot.displayName,
            donorEmail: hold.email || slot.donorEmail,
            holdExpiresAt: null,
          });
        }
      }
      tx.deleteHold(hold._id);
    }
    return holds.length;
  });
  return { marked };
}

