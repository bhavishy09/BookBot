/**
 * Thin API client — all backend calls go through here.
 * The Vite dev server proxies these to FastAPI (see vite.config.js).
 */
const BASE = '' // proxied in dev; change to full URL in production

/**
 * Core fetch wrapper with JSON handling and error extraction.
 */
export async function fetchJSON(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

/**
 * Build Authorization header from localStorage token.
 * Returns empty object if no token is stored.
 */
export function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ── Auth ──────────────────────────────────────────────────────────

export const login = (email, password) =>
  fetchJSON('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

// ── Appointments ──────────────────────────────────────────────────

export const listAppointments = (params = '') =>
  fetchJSON(`/appointments/?${params}`)

/** Fetch the list of available services (id, name, duration). */
export const listServices = () => fetchJSON('/appointments/services')

export const createAppointment = (data) =>
  fetchJSON('/appointments/', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })

export const updateAppointment = (id, data) =>
  fetchJSON(`/appointments/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })

export const cancelAppointment = (id) =>
  fetchJSON(`/appointments/${id}/cancel`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })

// ── Chat ──────────────────────────────────────────────────────────

export const sendChat = (sessionId, message) =>
  fetchJSON('/chat/', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, message }),
  })

// ── Health ────────────────────────────────────────────────────────

export const healthCheck = () => fetchJSON('/health')