/**
 * POST /contactMessage — port of post_contactMessage (contact + interest
 * lanes). Validation comes from contact-intake.js; the response is generic.
 */
import * as store from '../store.js';
import {
  CONTACT_MESSAGES_COLLECTION,
  INTEREST_MESSAGES_COLLECTION,
  GENERIC_FORM_SUCCESS_MESSAGE,
  validateContactMessage,
  buildSubmissionAuditDetails,
} from '../contact-intake.js';
import { persistAuditEvent } from '../audit.js';
import { hashForAudit } from '../util.js';

export async function contactMessage(input = {}) {
  const lane = input.form === 'interest' || input.lane === 'interest' ? 'interest' : 'contact';
  const collection = lane === 'interest' ? INTEREST_MESSAGES_COLLECTION : CONTACT_MESSAGES_COLLECTION;

  const result = validateContactMessage(input, { collection });
  if (!result.ok) {
    return { ok: false, success: false, error: result.error };
  }

  const record = store.insert(collection, result.message);
  await persistAuditEvent(
    lane === 'interest' ? 'INTEREST_SUBMITTED' : 'CONTACT_MESSAGE_SUBMITTED',
    buildSubmissionAuditDetails(record, { ipHash: null }),
  );

  return { ok: true, success: true, message: GENERIC_FORM_SUCCESS_MESSAGE, id: record._id };
}
