// API client — live PHP backend (TASK-026 completed the cutover; no mock
// functions remain). Envelope everywhere:
// { success, message, data }; thrown Error carries .status + .payload.
//
// Live mapping:
//   getServices()            -> GET /api/public/services
//   getAvailabilitySummary() -> GET /api/public/availability
//   submitAppointment()      -> POST /api/public/appointments
//   getAnnouncements()       -> GET /api/public/announcements
//   lookupAppointment()      -> POST /api/public/appointments/lookup

// Live backend cutover point (TASK-016). All functions below go through
// request(). Error shape: thrown Error with .status and
// .payload = { success: false, message, data }.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')

export async function request(path, { method = 'GET', body, credentials } = {}) {
  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      credentials,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    const err = new Error('Cannot reach the server. Check your connection and try again.')
    err.status = 0
    err.payload = { success: false, message: err.message, data: null }
    throw err
  }
  let payload = null
  try {
    payload = await res.json()
  } catch {
    payload = null
  }
  if (!res.ok || !payload || payload.success !== true) {
    const message =
      (payload && payload.message) || 'Something went wrong. Please try again.'
    const err = new Error(message)
    err.status = res.status
    err.payload = { success: false, message, data: (payload && payload.data) ?? null }
    throw err
  }
  return payload
}

export async function getServices() {
  return request('/api/public/services')
}

export async function getAvailabilitySummary({ serviceId, from, to } = {}) {
  const params = new URLSearchParams()
  if (serviceId !== undefined && serviceId !== '') params.set('service_id', String(serviceId))
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const query = params.toString()
  return request(`/api/public/availability${query ? `?${query}` : ''}`)
}

export async function getAnnouncements() {
  return request('/api/public/announcements')
}

// Staff session calls. Cookie-based; credentials:'include' so the browser
// sends the session cookie cross-origin in dev (Vite :5173 → API :8000).
// Wired live in TASK-013.
export async function staffLogin(username, password) {
  return request('/api/auth/login', { method: 'POST', body: { username, password }, credentials: 'include' })
}

export async function staffLogout() {
  return request('/api/auth/logout', { method: 'POST', credentials: 'include' })
}

export async function staffMe() {
  return request('/api/auth/me', { credentials: 'include' })
}

// Staff appointment administration (TASK-015, live). Cookie session required;
// guests get 401, staff role gets 403 on status changes.
export async function staffAppointmentList({ status, serviceId, dateFrom, dateTo, q, page, perPage } = {}) {
  const params = new URLSearchParams()
  if (status !== undefined && status !== '') params.set('status', String(status))
  if (serviceId !== undefined && serviceId !== '') params.set('service_id', String(serviceId))
  if (dateFrom) params.set('date_from', dateFrom)
  if (dateTo) params.set('date_to', dateTo)
  if (q !== undefined && q !== '') params.set('q', String(q))
  if (page !== undefined) params.set('page', String(page))
  if (perPage !== undefined) params.set('per_page', String(perPage))
  const query = params.toString()
  return request(`/api/appointments${query ? `?${query}` : ''}`, { credentials: 'include' })
}

export async function staffAppointmentDetail(referenceNo) {
  return request(`/api/appointments/${encodeURIComponent(String(referenceNo || '').trim())}`, { credentials: 'include' })
}

export async function staffUpdateStatus(referenceNo, { status, reason } = {}) {
  return request(`/api/appointments/${encodeURIComponent(String(referenceNo || '').trim())}/status`, {
    method: 'PATCH',
    body: { status, reason },
    credentials: 'include',
  })
}

// Scheduling master-data administration (TASK-020, admin+ only).
export async function adminServicesList() {
  return request('/api/services', { credentials: 'include' })
}

export async function adminUpdateService(id, fields) {
  return request(`/api/services/${encodeURIComponent(String(id))}`, {
    method: 'PATCH',
    body: fields,
    credentials: 'include',
  })
}

export async function adminSchedulesList() {
  return request('/api/schedules', { credentials: 'include' })
}

export async function adminUpdateSchedule(id, fields) {
  return request(`/api/schedules/${encodeURIComponent(String(id))}`, {
    method: 'PATCH',
    body: fields,
    credentials: 'include',
  })
}

export async function adminClosuresList() {
  return request('/api/closures', { credentials: 'include' })
}

export async function adminAddClosure({ closure_date, reason }) {
  return request('/api/closures', {
    method: 'POST',
    body: { closure_date, reason },
    credentials: 'include',
  })
}

export async function adminDeleteClosure(id) {
  return request(`/api/closures/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    credentials: 'include',
  })
}
// Public status lookup (TASK-026, live). Reference + contact suffix are POSTed
// (never in URLs) and the response stays minimal: status + schedule only.
export async function lookupAppointment(referenceNo, contactSuffix) {
  return request('/api/public/appointments/lookup', {
    method: 'POST',
    body: { reference_no: referenceNo, contact_suffix: contactSuffix },
  })
}

// Live submission. Canonical payload uses API field names; the booking flow
// collects them directly. Server revalidates everything (422) and rejects
// taken slots (409) — both surface as thrown Errors with .status.
export async function submitAppointment(payload) {
  const { full_name, address, contact_number, service_id, appointment_date, start_time } = payload || {}
  return request('/api/public/appointments', {
    method: 'POST',
    body: { full_name, address, contact_number, service_id, appointment_date, start_time },
  })
}
