# ACMIS API

Status: **One endpoint implemented as of 2026-10-15: `GET /api/health`.** Everything else is Planned; no database, auth, or business logic exists yet.

Update policy (mandatory per `RULES.md §6`): update this file whenever a contract changes — endpoint behavior, parameters, response shapes, permissions, errors.

## Implemented

### `GET /api/health`
- Purpose: liveness probe. No database, no auth.
- Handler: `backend/src/Modules/Health/HealthController.php::check()` via `backend/public/index.php` + `backend/src/Routes/api.php`.
- Verified 2026-10-15 live (`php -S localhost:8000 -t backend/public`): HTTP 200 + body below.
- Response: `{ success: true, message: "ACMIS API is running.", data: { status: "ok", time: "<ISO-8601 UTC>" } }`
- Unknown routes/methods: JSON 404 `{ success: false, message: "Not found.", data: null }` (verified live `/api/nope` → 404, no leaked paths).

## Envelope (Planned, mirrored by mock)

All responses use `{ success, message, data }` (see `frontend/src/services/api.js:14-23` `ok()`/`fail()`).

- Success: `{ success: true, message, data }`
- Failure: thrown `Error` with `err.status` + `err.payload = { success: false, message, data }`
- Status codes (intent, per `RULES.md §6`): `400/422` invalid input, `401` unauthenticated, `403` unauthorized, `404` nonexistent/inaccessible (to avoid disclosure where needed), `500` unexpected (safe message only, no SQL/stack/file paths).

## Mock-to-Planned mapping (current frontend only)

Source: `frontend/src/services/api.js`, `frontend/src/services/mockData.js`. All synthetic; reference `ACMIS-2026-…` IDs only.

| Mock function (`api.js`) | Planned endpoint (from `DEVELOPMENT_PLAN.md §9`) | Mock behavior (Implemented in mock) |
|--------------------------|---------------------------------------------------|--------------------------------------|
| `getServices()` (`api.js:25-28`) | `GET /api/public/services` | Returns `mockServices` (6 synthetic services) after ~250ms |
| `getAvailabilitySummary()` (`api.js:30-33`) | `GET /api/public/availability` | Returns `mockAvailability` (date/service/slots_left/capacity) |
| `getAnnouncements()` (`api.js:35-41`) | Planned (not in §9 list; UI-only board) | Sorted pinned-first synthetic items |
| `lookupAppointment(ref, suffix)` (`api.js:45-59`) | `GET /api/appointments/{id}` family (public lookup TBD privacy-preserving) | Requires `reference_no` + contact suffix; `422` if missing; `404` if no match; strips `contact_suffix` before returning (status + schedule only) |
| `submitAppointment(payload)` (`api.js:62-76`) | `POST /api/public/appointments` | Validates name/contact/service/date; `422` if missing or mobile not `09xxxxxxxxx`; returns generated `reference_no` + `status: pending` |

Full Planned families (names may be refined consistently, per `DEVELOPMENT_PLAN.md §9`): `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `GET /api/public/services`, `GET /api/public/availability`, `POST /api/public/appointments`, `GET /api/appointments`, `GET /api/appointments/{id}`, `PATCH /api/appointments/{id}/status`, `GET/POST /api/patients`, `GET/PATCH /api/patients/{id}`, `GET/POST /api/patients/{id}/consultations`, `GET /api/reports/appointments`. All marked **Planned — not implemented**.

## Privacy + error rules
- Public lookup returns schedule + status only; never consultation notes or patient history (`RULES.md §9`).
- No SQL errors, stack traces, file paths, or secrets in responses (`RULES.md §6`).
- List endpoints will use pagination + bounded result sets when implemented.
- Never treat a mocked response as proof the real API works (`RULES.md §6`).

---
## Related notes
- Role: spec — endpoint contracts (1 Implemented: `GET /api/health`, rest Planned).
- Governed by: [[RULES]] · [[DEVELOPMENT_PLAN]] · [[docs/DECISIONS|DECISIONS]] (mock-only, stack lock)
- Boundaries: [[docs/ARCHITECTURE|ARCHITECTURE]] · Schema: [[docs/DATABASE|DATABASE]]
- Verified by: [[docs/TESTING|TESTING]] · Runs via: [[docs/DEPLOYMENT|DEPLOYMENT]]
- Work queue: [[TASKS]] · UI voice: [[docs/brand-guidelines|brand-guidelines]]
