// Mock API client — frontend-first development.
// Keep the { success, message, data } shape from DEVELOPMENT_PLAN §7
// so switching to the PHP REST API later is a drop-in replacement.
//
// Future backend mapping:
//   getServices()        -> GET /api/v1/public/services (to be specified)
//   lookupAppointment()  -> GET /api/v1/public/appointments/{reference}
//   submitAppointment()  -> POST /api/v1/public/appointments

import { mockAnnouncements, mockAppointments, mockAvailability, mockServices } from './mockData'

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

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
  await delay(250)
  return ok('Services retrieved.', mockServices)
}

export async function getAvailabilitySummary() {
  await delay(250)
  return ok('Availability retrieved.', mockAvailability)
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

// Mock submission: validates, returns pending + generated reference.
export async function submitAppointment(payload) {
  await delay(500)
  const { fullName, contactNo, serviceId, scheduleDate } = payload || {}
  if (!fullName || !contactNo || !serviceId || !scheduleDate) {
    return fail('Name, contact number, service, and preferred date are required.', null, 422)
  }
  if (!/^09\d{9}$/.test(String(contactNo).replace(/\s/g, ''))) {
    return fail('Enter a valid 11-digit mobile number (e.g. 09xx xxx xxxx).', null, 422)
  }
  const rand = Math.floor(100000 + Math.random() * 900000)
  return ok('Appointment request submitted.', {
    reference_no: `ACMIS-2026-${String(rand).slice(0, 6)}`,
    status: 'pending',
  })
}
