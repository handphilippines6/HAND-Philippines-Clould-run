// HTTP-function client for the Adopt an Island board.
//
// The React SPA is hosted on Google Cloud; the backend stays on Wix, so the
// client reaches the Wix `/_functions/*` endpoints cross-origin. Set
// VITE_API_BASE to the Wix origin (default: https://www.hand-philippines.org).
// CORS for these endpoints is already handled by backend/http-functions.js.
const ORIGIN = import.meta.env.VITE_API_BASE || 'https://www.hand-philippines.org';
const API_BASE = `${ORIGIN}/_functions`;

async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { ok: false, success: false, error: text || 'Invalid response from server.' };
  }
  return data;
}

export function getIslandBoard() {
  return apiFetch('islandBoard');
}

export function startIslandGift(slotIds, name, email, firstName, lastName) {
  return apiFetch('startIslandGift', {
    method: 'POST',
    body: JSON.stringify({ slotIds, displayName: name, email, firstName, lastName }),
  });
}

export function reserveIslandSlots(slotIds, name, email, firstName, lastName) {
  return apiFetch('reserveIslandSlots', {
    method: 'POST',
    body: JSON.stringify({ slotIds, displayName: name, email, firstName, lastName }),
  });
}

export function releaseIslandHold(paymentIntentId) {
  return apiFetch('releaseIslandHold', {
    method: 'POST',
    body: JSON.stringify({ paymentIntentId }),
  });
}

export function getPublishableKey() {
  return apiFetch('stripePublishableKey');
}
