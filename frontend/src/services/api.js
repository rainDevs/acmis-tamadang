// API client — live PHP backend with mock fallback only where no endpoint
// exists yet (announcements board, status lookup). Envelope everywhere:
// { success, message, data }; thrown Error carries .status + .payload.
//
// Live mapping:
//   getServices()            -> GET /api/public/services
//   getAvailabilitySummary() -> GET /api/public/availability
//   submitAppointment()      -> POST /api/public/appointments
//   lookupAppointment()      -> mock (no public lookup endpoint yet)

import { mockAnnouncements, mockAppointments } from './mockData'

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

// Live backend cutover point (TASK-016). Mock functions below stay as-is until
// TASK-011 switches each one to request(). Error shape stays mock-compatible:
// thrown Error with .status and .payload = { success: false, message, data }.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')

export async function request(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
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

function ok(message, data) {
  return { success: true, message, data }
}

function fail(message, data = null, status = 400) {
  const err = new Error(message)
  err.status = status
  err.payload = { success: false, message, data }
  throw err
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
  await delay(250)
  const sorted = [...mockAnnouncements].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date),
  )
  return ok('Announcements retrieved.', sorted)
}

// Public lookup MUST stay minimal: status + schedule only. No clinical data.
// Requires reference_no + contact suffix verification (mock of approved verification step).
export async function lookupAppointment(referenceNo, contactSuffix) {
  await delay(400)
  const ref = String(referenceNo || '').trim().toUpperCase()
  const suffix = String(contactSuffix || '').trim()

  if (!ref || !suffix) {
    return fail('Reference number and contact verification are required.', null, 422)
  }
  const record = mockAppointments[ref]
  if (!record || record.contact_suffix !== suffix) {
    return fail('No matching request found. Check your reference and verification.', null, 404)
  }
  const { contact_suffix: _hidden, ...publicSafe } = record
  return ok('Appointment status retrieved.', publicSafe)
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
