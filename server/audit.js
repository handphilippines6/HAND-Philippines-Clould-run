/**
 * Audit log — port of backend/audit.js persistAuditEvent.
 * Events are append-only rows in the AuditLog collection (safe metadata only).
 */
import { insert } from './store.js';

export async function persistAuditEvent(eventType, details = {}) {
  try {
    insert('AuditLog', {
      eventType,
      details,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    // Auditing must never break the request it observes.
    console.warn('[audit] Could not persist event:', eventType, error?.message || error);
  }
}
