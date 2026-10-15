# ACMIS API

Status: **Five endpoints implemented as of 2026-10-16: `GET /api/health`, `GET /api/health/db`, `GET /api/public/services`, `GET /api/public/availability`, `POST /api/public/appointments`.** No auth, lookup, status workflow, or staff endpoints exist yet.

Update policy (mandatory per `RULES.md §6`): update this file whenever a contract changes — endpoint behavior, parameters, response shapes, permissions, errors.

## Implemented

### `GET /api/health`
- Purpose: liveness probe. No database, no auth.
- Handler: `backend/src/Modules/Health/HealthController.php::check()` via `backend/public/index.php` + `backend/src/Routes/api.php`.
- Verified 2026-10-15 live (`php -S localhost:8000 -t backend/public`): HTTP 200 + body below.
- Response: `{ success: true, message: "ACMIS API is running.", data: { status: "ok", time: "<ISO-8601 UTC>" } }`
- Unknown routes/methods: JSON 404 `{ success: false, message: "Not found.", data: null }` (verified live `/api/nope` → 404, no leaked paths).

### `GET /api/health/db`
- Purpose: database liveness probe. Runs `SELECT 1` only; assumes no schema.
- Handler: `backend/src/Modules/Health/DbHealthController.php::check()` via `Connection::make(Config::db())` + `Connection::ping()`.
- Verified 2026-10-16 live (`php -S localhost:8000 -t backend/public`, no MySQL in this environment): HTTP 503 + `{ success: false, message: "Database unavailable.", data: null }` — no DSN/host/credential/SQL leak. Success path (200 `{ success: true, message: "Database connection is working.", data: { status: "ok" } }`) verified via injected-PDO CLI test; live-200 against real MySQL is Outstanding until MySQL is provisioned.
- Failure handling: thrown errors are logged server-side (`ApiError::log`, class + code only, password scrubbed) and mapped to the fixed 503 message.

### `GET /api/public/services` (public, no auth)
- Purpose: approved service catalog for the booking flow and landing page.
- Handler: `backend/src/Modules/Services/ServicesController.php::list()`.
- Verified 2026-10-16 (CLI 7/7 on disposable DB + live 200 with 6 approved rows, uniform 30-min duration, inactive hidden).
- Response: `{ success: true, message: "Services retrieved.", data: [{ id, name, description (null today), duration_minutes }] }`. UI note: `id` is int (old mock used strings); landing icons key by approved `name`.

### `GET /api/public/availability` (public, no auth)
- Purpose: bookable-slot lookup for the request form. Template − closures − occupying bookings = availability. Counts only, never patient data.
- Handler: `backend/src/Modules/Availability/AvailabilityController.php::handle()` + `AvailabilityService::days()`; route `GET /api/public/availability`.
- Query: `service_id` (optional int; omit = all active services), `from`/`to` (optional `YYYY-MM-DD`; default today → +13 days Asia/Manila; window capped at 31 days).
- Verified live 2026-10-16 against disposable MySQL: `?service_id=1&from=2026-10-20&to=2026-10-20` → 200, 1 day, 18 slots, 18 left; `?service_id=999…` → 422 `Unknown or inactive service.` (server log confirms 200 + 422).
- Occupancy rule: `pending` + `approved` bookings occupy a slot; `rejected`/`cancelled`/`completed`/`no_show` free it. Past slots return `is_available:false`. Closure dates return `closed:true` with empty `slots`.
- Response: `{ success: true, message: "Availability retrieved.", data: [{ date, service_id, service_name, closed, slots: [{ start_time ("HH:MM"), capacity, booked, slots_left, is_available }], slots_left, capacity }] }`. Day totals (`date`, `service_id`, `slots_left`, `capacity`) match the frontend mock keys in `frontend/src/services/mockData.js:69-73`, except `service_id` is int (mock uses strings — frontend mapping update belongs to TASK-011).
- Invalid service/date/range → 422 with safe message; DB unreachable → 503 `Database unavailable.`.

### `POST /api/public/appointments` (public, no auth)
- Purpose: submit an appointment request. Creates one `pending` row; staff approval happens later (TASK-015).
- Handler: `backend/src/Modules/Appointments/AppointmentController.php::handle()` (validation) + `AppointmentService::book()` (transaction + `SELECT … FOR UPDATE` capacity check + insert).
- Body (JSON): `full_name` (non-empty, ≤100), `contact_number` (`09` + 9 digits, spaces tolerated — same rule as the frontend mock), `service_id` (active service), `appointment_date` (`YYYY-MM-DD`, not past, Manila), `start_time` (`HH:MM` 24h, must match a template slot on a non-closed day and not be past).
- Verified live 2026-10-16 against disposable MySQL: valid POST → 201 `{ reference_no: "ACMIS-2026-030390", status: "pending", service_id, appointment_date, start_time }`; repeat POST → 409 `Selected schedule is no longer available.`; bad mobile → 422 (server log confirms 201 + 409 + 422).
- Capacity: `pending` + `approved` rows occupy the slot; the check runs inside the transaction so concurrent requests cannot overbook; a double-submit surfaces as 409; cancelled slots are re-bookable. Reference is `ACMIS-YYYY-XXXXXX`, collision-retried.
- Errors: 422 invalid input/past/off-grid/closed/weekend slot or malformed JSON; 409 taken slot; 503 DB unreachable; 500 safe fallback. Response echoes only the requester's own submitted data.

## Error conventions (Implemented 2026-10-16, `backend/src/Shared/ApiError.php`)

## Error conventions (Implemented 2026-10-16, `backend/src/Shared/ApiError.php`)

All errors use the `{ success: false, message, data }` envelope with fixed safe messages:

| Helper | Code | Message |
|--------|------|---------|
| `validation($message, $fields)` | 422 | caller-supplied safe message + `{ fields }` |
| `unauthenticated()` | 401 | `Authentication required.` |
| `forbidden()` | 403 | `You do not have permission to perform this action.` |
| `notFound()` | 404 | `Not found.` |
| `serverError()` | 500 | `An unexpected error occurred.` |
| `unavailable()` | 503 | `Database unavailable.` |

- The front controller (`backend/public/index.php`) wraps route dispatch in try/catch: unexpected throws are logged via `ApiError::log()` and mapped to safe 500.
- `ApiError::log($context, $e)` writes `error_log` with exception class + code + message length only (no stack trace); any configured `DB_PASS` value is scrubbed before measuring. Server detail never reaches the client.

## CORS (narrow, per `RULES.md §8`)

- The front controller reflects `Access-Control-Allow-Origin` only for whitelisted origins (default `http://localhost:5173`, `http://127.0.0.1:5173` for Vite dev; override via `CORS_ALLOWED_ORIGINS` env, comma-separated). No wildcard-with-credentials. `OPTIONS` preflight → 204 (`GET, POST, OPTIONS`; `Content-Type`).
- Verified 2026-10-16 with header checks: whitelisted origin reflected, preflight 204, unlisted origin gets no ACAO header, routing unaffected.

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
- Role: spec — endpoint contracts (5 Implemented; rest Planned).
- Governed by: [[RULES]] · [[DEVELOPMENT_PLAN]] · [[docs/DECISIONS|DECISIONS]] (mock-only, stack lock)
- Boundaries: [[docs/ARCHITECTURE|ARCHITECTURE]] · Schema: [[docs/DATABASE|DATABASE]]
- Verified by: [[docs/TESTING|TESTING]] · Runs via: [[docs/DEPLOYMENT|DEPLOYMENT]]
- Work queue: [[TASKS]] · UI voice: [[docs/brand-guidelines|brand-guidelines]]
