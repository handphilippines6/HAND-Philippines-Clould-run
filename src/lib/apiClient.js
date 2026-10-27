/**
 * fetch/axios wrapper — auth header injection, timeouts, JSON handling.
 * The backend validates and authorizes; this client only requests and
 * displays (02_SYSTEM_ARCHITECTURE §1).
 */
const BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  if (signal) signal.addEventListener('abort', () => controller.abort());

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    if (res.status === 204) return null;
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  getOptional: async (path, fallback) => {
    try {
      return await request(path, { method: 'GET' });
    } catch {
      return fallback;
    }
  },
};

export default api;
