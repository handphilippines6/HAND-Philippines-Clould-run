/**
 * Contact and interest form intake — port of backend/contact-intake.js (doc 03 §6):
 * public forms validate shape, length, email, consent, and abuse limits; they
 * store only the minimum required fields and return generic success/error copy.
 */
import crypto from 'node:crypto';
import { normalizeEmail, normalizePhone } from './validation.js';

export const CONTACT_MESSAGES_COLLECTION = 'ContactMessages';
export const INTEREST_MESSAGES_COLLECTION = 'Interests';

/** Inquiry types offered by the contact page. */
export const CONTACT_MESSAGE_TYPES = ['General Inquiry', 'Partnership', 'Volunteer', 'Donation'];

/** Interest types offered by the Get Involved page. */
export const INTEREST_TYPES = ['Volunteer', 'Partner', 'Fundraise', 'Other'];

export const CONTACT_FIELD_LIMITS = {
  name: 120,
  email: 254,
  phone: 32,
  organization: 160,
  message: 4000,
};

export const GENERIC_FORM_SUCCESS_MESSAGE =
  'Thank you — your message has been received. Our team will reply within a few business days.';

export function genericFormError(message = 'Please check the highlighted fields and try again.') {
  return { ok: false, error: message };
}

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function cleanMessage(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

/**
 * Validates and normalizes a contact/interest submission.
 * @returns {{ok: true, message: object}|{ok: false, error: string}}
 */
export function validateContactMessage(input, options = {}) {
  const item = input || {};
  const collection = options.collection || CONTACT_MESSAGES_COLLECTION;
  const allowedTypes =
    collection === INTEREST_MESSAGES_COLLECTION ? INTEREST_TYPES : CONTACT_MESSAGE_TYPES;

  const name = cleanText(item.name, CONTACT_FIELD_LIMITS.name);
  const email = normalizeEmail(item.email);
  const phone = normalizePhone(item.phone).slice(0, CONTACT_FIELD_LIMITS.phone);
  const organization = cleanText(item.organization, CONTACT_FIELD_LIMITS.organization);
  const body = cleanMessage(item.message, CONTACT_FIELD_LIMITS.message);
  const requestedType = cleanText(item.type, 60);
  const type = allowedTypes.includes(requestedType) ? requestedType : allowedTypes[0];

  if (name.length < 2) return genericFormError('A name is required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return genericFormError('A valid email address is required.');
  }
  if (body.length < 10) {
    return genericFormError('Please include a short message (at least 10 characters).');
  }
  if (item.consent !== true) {
    return genericFormError('Consent is required before we can store your message.');
  }

  return {
    ok: true,
    message: {
      type,
      name,
      email,
      phone: phone || null,
      organization: organization || null,
      message: body,
      consent: true,
      consentVersion: cleanText(item.consentVersion, 40) || 'v1',
      source: cleanText(item.source, 80) || 'contact-page',
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

/** Safe audit details: shape only, never the message body or raw address. */
export function buildSubmissionAuditDetails(message, actor = {}) {
  const hashForAudit = (value) =>
    crypto.createHash('sha256').update(String(value || '')).digest('hex').slice(0, 32);
  return {
    type: message?.type || null,
    emailHash: message?.email ? hashForAudit(message.email) : null,
    hasPhone: Boolean(message?.phone),
    messageLength: typeof message?.message === 'string' ? message.message.length : 0,
    source: message?.source || null,
    ipHash: actor.ipHash || null,
  };
}
