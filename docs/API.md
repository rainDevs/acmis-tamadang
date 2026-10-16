# ACMIS API

Status: **Twenty endpoints implemented as of 2026-10-16** (7 public + 3 auth + 3 staff appointments + 7 staff services). All frontend functions read live.

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

### `GET /api/public/announcements` (public, no auth)
- Purpose: community bulletin board. Read-only reference rows; publishing workflow (who creates/edits) is deferred to TASK-021.
- Handler: `backend/src/Modules/Announcements/AnnouncementsController.php::list()`.
- Verified 2026-10-16 (CLI 9/9 on disposable DB + live 200 with 4 seeded rows, pinned first).
- Response: `{ success: true, message: "Announcements retrieved.", data: [{ id, type, title, body, pinned, date }] }` (`date` maps `posted_at`; ordered pinned-first, then newest; `LIMIT 50`). Empty table → 200 `[]`.

### `GET /api/appointments` (staff-only, TASK-015)
- Purpose: request queue. Any signed-in staff may list; rows are data-minimized (no contact/address — detail-only).
- Query: `status` (`all` or canonical, default `all`), `service_id`, `date_from`/`date_to` (`YYYY-MM-DD`), `q` (reference or name substring, ≤100), `page` (≥1), `per_page` (1–50, default 5). Bad values → 422.
- Verified 2026-10-16 (CLI 28/28 on disposable DB + live 200 via cookiejar).
- Response: `{ success: true, message: "Requests retrieved.", data: { rows: [{ reference_no, status, service_id, service_name, appointment_date, start_time, requester_name }], page, per_page, total, pages, counts: { all, pending, … } } }` (`counts` ignores the status filter; ordered newest-first).

### `GET /api/appointments/{reference}` (staff-only, TASK-015)
- Purpose: full request + actor history for the detail screen. Reference is uppercased server-side (lowercase URLs work); unknown/malformed → 404.
- Verified 2026-10-16 (CLI + live 200).
- Response: `{ success: true, message: "Request retrieved.", data: { reference_no, status, service_id, service_name, appointment_date, start_time, requester_name, contact_number, address, created_at, history: [{ status, at, actor, note }] } }` (history may be `[]` — pre-existing rows have no backfill).

### `PATCH /api/appointments/{reference}/status` (superadmin/admin only, TASK-015)
- Purpose: review decisions. Enforces `RequireAuth::APPOINTMENT_REVIEW_ROLES` (staff → 403, guests → 401); transitions `pending→approved/rejected`, `approved→completed/no_show/cancelled` inside a row-locked transaction (concurrent re-transition → 422); `reason` required for `rejected`/`cancelled` (≤500); actor + timestamp written to `appointment_status_history`.
- Verified 2026-10-16 (CLI 28/28 + live cookiejar approve 200 → repeat 422).
- Response: 200 with the updated detail record (same shape as above).

### `POST /api/public/appointments/lookup` (public, no auth, TASK-026)
- Purpose: residents check their own request. POST body `{ reference_no, contact_suffix }` (never in URLs/logs). Timing-safe suffix check; wrong suffix, unknown or malformed reference → identical 404 `No matching request found…`; missing fields → 422.
- Verified 2026-10-16 (CLI 11/11 on disposable DB + live 200/404).
- Response: `{ success: true, message: "Appointment status retrieved.", data: { reference_no, service_name, schedule_date, start_time, status } }` — nothing else. Known limitation: no brute-force throttle (reference has ~2B combinations).

### `GET /api/services` (admin+ only, TASK-020)
- Purpose: full catalog for the Services admin page, including inactive rows.
- Verified 2026-10-16 (CLI 32/32 on disposable DB + live 200 via cookiejar).
- Response: `{ success: true, message: "Services retrieved.", data: { services: [{ id, name, description, duration_minutes, is_active }] } }`.

### `PATCH /api/services/{id}` (admin+ only, TASK-020)
- Purpose: edit description (≤255), `duration_minutes` (5–480), `is_active`. Names stay the approved catalog — `name` (or any other key) → 422; unknown id → 404.
- Verified 2026-10-16 (CLI + live 200).

### `GET /api/schedules` (admin+ only, TASK-020)
- Purpose: weekly template rows, optional `?service_id=` (applies-to-all rows included). Bad filter → 422.
- Verified 2026-10-16 (CLI + live 200).
- Response: `{ success: true, data: { schedules: [{ id, service_id, service_name, day_of_week, start_time, end_time, slot_duration_minutes, capacity_per_slot, is_active }] } }` (times `HH:MM`).

### `PATCH /api/schedules/{id}` (admin+ only, TASK-020)
- Purpose: edit window (`HH:MM`, end after start), slot duration (5–480), capacity (1–50), `is_active`. Day/service structure immutable → 422; unknown id → 404. Applies to future bookings only.
- Verified 2026-10-16 (CLI + live 200).

### `GET /api/closures` · `POST /api/closures` · `DELETE /api/closures/{id}` (admin+ only, TASK-020)
- Purpose: holiday closure dates. POST `{ closure_date (YYYY-MM-DD), reason? (≤255) }` → 201; duplicate date → 409; bad date → 422; delete missing → 404.
- Verified 2026-10-16 (CLI + live 201/409/200).

### `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` (TASK-013)
- Purpose: staff username/password sessions. `login` verifies via `password_verify()` (transparent rehash), regenerates the session id, and returns `{ user: { id, username, display_name, role } }` — never a hash. `logout` destroys session + cookie. `me` returns the session user or 401.
- Errors: empty/bad credentials → 401 `Incorrect username or password.` (identical for unknown users and inactive accounts — no enumeration); 5 failures → 429 `Too many failed attempts…` (5-min lock per username); spoofed-Origin POSTs → 403; DB down → 503.
- Sessions: cookie `ACMISSESSID`, HttpOnly always, Secure + SameSite via env (dev cross-origin: `None`+Secure; prod same-origin: `Lax`+Secure), browser-session lifetime + 120-min server idle timeout. Auth events logged server-side (username only, never passwords).
- Verified 2026-10-16: CLI 13/13 (`tests/auth_check.php`); live cookiejar flow login 200 → me 200 → logout 200 → me 401; 4× 401 then 429 + 429; spoofed Origin 403; cross-origin login emits reflected ACAO + `Allow-Credentials` + `SameSite=None; secure` cookie (server log confirms all codes).

### Staff auth gate (TASK-023 — authenticated-staff-only, no role checks)
- Purpose: single enforcement point every future staff endpoint calls first. `RequireAuth::check()` (`backend/src/Modules/Auth/RequireAuth.php`) starts the session: guest/expired/destroyed → 401 `Authentication required.`; signed-in → `['user' => { id, username, display_name, role }]` (never a hash).
- Role distinctions are NOT enforced — the Q-05 permission matrix stays deferred in TASK-014. Known limitation (documented in code): deactivation takes effect on next login; sessions stay valid until the 120-min idle timeout.
- Verified 2026-10-16: CLI 6/6 (`tests/require_auth_check.php`, session-only, no DB); live guest `GET /api/auth/me` → 401 + safe body, `GET /api/health` → 200 (server log confirms 401/401/200).

## Authorization — default RBAC (TASK-014)

Every staff endpoint gates through `AccessPolicy::requireModule()` (`backend/src/Modules/Auth/AccessPolicy.php`): guests → 401 `Authentication required.`, wrong role → 403 `You do not have permission…` (no role names leaked). Approved default matrix (Q-05, `docs/DECISIONS.md`):

| Module | superadmin | admin | staff |
|---|---|---|---|
| `appointments.view` (list/detail) | ✅ | ✅ | ✅ |
| `appointments.review` (PATCH status) | ✅ | ✅ | 403 |
| `patients`, `consultations`, `reports` | ✅ | ✅ | ✅ |
| `services`, `announcements`, `users` | ✅ | ✅ | 403 |

This is the DEFAULT matrix — granular per-user overrides come later and take precedence. Verified 2026-10-16: CLI 48/48 (`tests/access_policy_check.php`), `APPOINTMENT_REVIEW_ROLES` proven in sync by test.

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
- Body (JSON): `full_name` (non-empty, ≤100), `address` (non-empty, ≤255 — staff verification), `contact_number` (`09` + 9 digits, spaces tolerated — same rule as the frontend mock), `service_id` (active service), `appointment_date` (`YYYY-MM-DD`, not past, Manila), `start_time` (`HH:MM` 24h, must match a template slot on a non-closed day and not be past).
- Verified live 2026-10-16 against disposable MySQL: valid POST → 201 `{ reference_no: "ACMIS-2026-030390", status: "pending", service_id, appointment_date, start_time }`; repeat POST → 409 `Selected schedule is no longer available.`; bad mobile → 422 (server log confirms 201 + 409 + 422).
- Capacity: `pending` + `approved` rows occupy the slot; the check runs inside the transaction so concurrent requests cannot overbook; a double-submit surfaces as 409; cancelled slots are re-bookable. Reference is `ACMIS-YYYY-XXXXXX`, collision-retried.
- Errors: 422 invalid input/past/off-grid/closed/weekend slot or malformed JSON; 409 taken slot; 503 DB unreachable; 500 safe fallback. Response echoes only the requester's own submitted data.

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

- The front controller reflects `Access-Control-Allow-Origin` only for whitelisted origins (default `http://localhost:5173`, `http://127.0.0.1:5173` for Vite dev; override via `CORS_ALLOWED_ORIGINS` env, comma-separated). No wildcard-with-credentials. `OPTIONS` preflight → 204 (`GET, POST, PATCH, OPTIONS`; `Content-Type`).
- Verified 2026-10-16 with header checks: whitelisted origin reflected, preflight 204, unlisted origin gets no ACAO header, routing unaffected.

## Staff UI endpoint needs (derived from TASK-017 screens — all Implemented in TASK-013/015)

The staff screens read live since TASK-015. This section stays as the design record; the implemented contracts above are authoritative.

- `POST /api/auth/login` — body `{ username, password }`; 200 sets the server session + returns `{ user: { username, roles } }`; 401 on bad credentials (no user-enumeration detail). Login screen fields/states are ready.
- `POST /api/auth/logout` — destroys the session (sign-out button). `GET /api/auth/me` — current user for the shell identity line; 401 drives the login redirect.
- `GET /api/appointments` (staff-only) — query: `status` (one of the 6 canonical), `service_id`, `date_from`/`date_to`, `q` (reference-no or name substring), `page`/`per_page` (UI uses 5/page with Newer/Older pager + total count). Returns bounded rows with `{ reference_no, status, service_id, service_name, appointment_date, start_time, requester_name }` — no contact/address in list rows (detail-only, data minimization).
- `GET /api/appointments/{reference}` (staff-only) — full record incl. `contact_number`, `address`, and `history[]` (`status`, `at`, `actor`, `note`) for the detail timeline.
- `PATCH /api/appointments/{reference}/status` (staff-only, role-gated per TASK-014) — body `{ status, reason? }`; `reason` required for `rejected`/`cancelled`; transitions restricted to `pending→approved/rejected`, `approved→completed/no_show/cancelled` (matches RULES §10); 422 on illegal transition; records actor + timestamp into history. Role rule (approved 2026-10-16, DECISIONS.md): only `superadmin`/`admin` may approve/reject (`RequireAuth::APPOINTMENT_REVIEW_ROLES`); `staff` gets 403 view-only. UI confirm dialog + reason capture already match this shape. Implemented live in TASK-015 (see endpoint section above).

## Envelope (live)

All responses use `{ success, message, data }` (see `frontend/src/services/api.js` `request()`).

- Success: `{ success: true, message, data }`
- Failure: thrown `Error` with `err.status` + `err.payload = { success: false, message, data }`
- Status codes (intent, per `RULES.md §6`): `400/422` invalid input, `401` unauthenticated, `403` unauthorized, `404` nonexistent/inaccessible (to avoid disclosure where needed), `500` unexpected (safe message only, no SQL/stack/file paths).

## Mock-to-live history (no mocks remain since TASK-027)

`frontend/src/services/mockData.js` was deleted in TASK-027 after every function below went live. Kept as a cutover record.

| Function (`api.js`) | Live endpoint | Former mock behavior |
|---------------------|---------------|----------------------|
| `getServices()` | `GET /api/public/services` (TASK-011) | Returned 6 synthetic services after ~250ms |
| `getAvailabilitySummary()` | `GET /api/public/availability` (TASK-009) | Returned synthetic date/service/slots_left/capacity |
| `getAnnouncements()` | `GET /api/public/announcements` (TASK-025) | Sorted pinned-first synthetic items |
| `lookupAppointment(ref, suffix)` | `POST /api/public/appointments/lookup` (TASK-026) | Matched an in-memory record + suffix; same 5 minimal keys |
| `submitAppointment(payload)` | `POST /api/public/appointments` (TASK-010) | Client-validated, returned generated `reference_no` + `pending` |

Remaining Planned families (per `DEVELOPMENT_PLAN.md §9`): `GET/POST /api/patients`, `GET/PATCH /api/patients/{id}`, `GET/POST /api/patients/{id}/consultations`, `GET /api/reports/appointments`. All marked **Planned — not implemented**.

## Privacy + error rules
- Public lookup returns schedule + status only; never consultation notes or patient history (`RULES.md §9`).
- No SQL errors, stack traces, file paths, or secrets in responses (`RULES.md §6`).
- List endpoints use pagination + bounded result sets (`page`/`per_page`, `LIMIT 50` board cap).
- Never treat a mocked response as proof the real API works (`RULES.md §6`). No mocks remain since TASK-027.

---
## Related notes
- Role: spec — endpoint contracts (8 Implemented: 5 public/health + 3 auth; rest Planned).
- Governed by: [[RULES]] · [[DEVELOPMENT_PLAN]] · [[docs/DECISIONS|DECISIONS]] (mock-only, stack lock)
- Boundaries: [[docs/ARCHITECTURE|ARCHITECTURE]] · Schema: [[docs/DATABASE|DATABASE]]
- Verified by: [[docs/TESTING|TESTING]] · Runs via: [[docs/DEPLOYMENT|DEPLOYMENT]]
- Work queue: [[TASKS]] · UI voice: [[docs/brand-guidelines|brand-guidelines]]
