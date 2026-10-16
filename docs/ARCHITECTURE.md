# ACMIS Architecture

Status: Live slices through TASK-027 (2026-10-16). No mock data remains in the UI: public booking, announcements, status lookup, staff auth, and appointment administration all run `Browser → React Frontend → PHP REST API → MySQL`. See `docs/DECISIONS.md` (2026-10-15 3-tier layout) for the authoritative root layout: `backend/`, `database/`, `docs/`, `frontend/`.

## Data flow

Implemented today: `Browser → React Frontend → PHP REST API → MySQL` (13 live endpoints; full list below).

Planned (per `DEVELOPMENT_PLAN.md §3` / `RULES.md §4`):

```text
Resident/Staff Browser → React Frontend → PHP REST API → MySQL
```

Rules (mandatory):
- Frontend must never connect directly to MySQL. [Implemented: `frontend/src/services/api.js` contains no SQL/DB driver; it imports only `./mockData`.]
- Frontend is not a security boundary. [Planned enforcement: all auth + validation in backend.]
- All authorization and business-critical validation enforced by backend (Planned — no backend code exists yet).

## Frontend — Implemented

## Frontend — Implemented (booking flow live, 2026-10-16)

`features/appointments/BookingFlow.jsx` (service → schedule → details → review → confirmation) with `ServiceStep`, `ScheduleStep` (date chips + slot grid), `DetailsStep` (client checks mirror server), `ReviewDialog` (Radix `Modal`, double-submit guard), `ConfirmationView` (selectable/copyable reference, pending notice). `RequestPage.jsx` rewritten (urgent-care + privacy notes per brand). `services/api.js`: `getServices`, `getAvailabilitySummary`, `submitAppointment` are live via `request()`; `lookupAppointment` + announcements stay mock (no backend yet).

Staff screens (TASK-017 screens, TASK-015 live): `features/staff/` (live session, `AppointmentList` with server filters/pagination/counts, `AppointmentDetail` with server record + PATCH status flow, `reviewMeta.js` button constants); `pages/admin/` (login, queue, detail, dashboard with live counts); `StaffLayout` header (logo + avatar menu: Profile dialog, theme toggle, sign out) + desktop sidebar / mobile drawer reuse of `StaffSidebar` (live pending badge). Endpoint needs for TASK-013/014/015 documented in `docs/API.md`.

Observed `frontend/src/` on 2026-10-15 (foundation in TASK-016):
- `App.jsx`, `main.jsx`, `index.css`
- `routes/index.jsx`: `/`, `/request`, `/status`, `/admin/login` (placeholder), `*` → NotFound, all under `layouts/PublicLayout.jsx`
- `layouts/PublicLayout.jsx`, `components/layout/Header.jsx`, `Footer.jsx`
- `components/shared/`: `Reveal.jsx`, `SectionHeading.jsx`, `StatusBadge.jsx`, `StickyMobileCta.jsx`, `ThemeToggle.jsx`
- `components/ui/button.jsx`
- `features/landing/`: `HeroVisual.jsx`, `CareSplit.jsx`, `RolesSplit.jsx`, `StatsStrip.jsx`
- `features/appointments/StatusLookupForm.jsx`, `features/announcements/AnnouncementList.jsx`, `features/faqs/FaqList.jsx`
- `pages/public/`: `LandingPage.jsx`, `RequestPage.jsx`, `StatusPage.jsx`, `NotFoundPage.jsx`; `pages/admin/StaffLoginPlaceholder.jsx`
- `services/api.js` (mock client, `{ success, message, data }` envelope), `services/mockData.js` (synthetic data only)
- `lib/utils.js`, `assets/` (svg/png), `hooks/` (empty), `components/layout/`, `features/` slices

Build: Vite 8 + React 19 + Tailwind v4 (`frontend/package.json`, `vite.config.js` with `@` → `./src`).

Design foundation (TASK-016, 2026-10-16): theme tokens brand-aligned in `index.css` (`--primary`/`--ring` emerald, `--accent` cyan tint, both modes — no `bg-emerald-*` one-offs remain outside status colors); `Button lg` = 44px touch target; shared patterns `ui/field.jsx` (`Field`/`TextInput`/`FormError` with `role="alert"`), `shared/LoadingState.jsx`, `shared/EmptyState.jsx`, `ui/dialog.jsx` (Radix bottom-sheet → centered card); `layouts/StaffLayout.jsx` minimal shell (nav lands in TASK-017); `services/api.js` gained a live `request()` helper (mock exports unchanged — cutover is TASK-011's job). `StatusLookupForm` dogfoods the new patterns.

## Backend — Implemented skeleton + health + DB connection + availability + booking + auth (20 files, 2026-10-16)

Observed `backend/` on 2026-10-16:
- `composer.json` (package `acmis/backend`, php >=8.1, PSR-4 `App\` → `src/`, zero dependencies; `composer validate` clean)
- `public/index.php` (front controller with try/catch → safe 500; serve: `php -S localhost:8000 -t backend/public`)
- `src/Shared/Response.php` (`App\Shared\Response::json()` envelope helper)
- `src/Shared/ApiError.php` (401/403/404/422/500/503 safe envelopes + `log()` without secrets)
- `src/Config/Config.php` (`env()` + `db()` from `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASS/DB_CHARSET`, defaults `localhost/3306/acmis/empty/utf8mb4`)
- `src/Database/Connection.php` (PDO MySQL factory: `ERRMODE_EXCEPTION`, `FETCH_ASSOC`, `EMULATE_PREPARES=false`; `ping()` via `SELECT 1`)
- `src/Routes/api.php` (route map: `GET /api/health`, `GET /api/health/db`)
- `src/Modules/Health/HealthController.php` (liveness probe, no DB/auth)
- `src/Modules/Health/DbHealthController.php` (DB probe; 200 on `SELECT 1`, safe 503 otherwise)
- `src/Modules/Availability/AvailabilityService.php` (slot computation: template − closures − pending/approved bookings; Manila wall-clock; counts only)
- `src/Modules/Availability/AvailabilityController.php` (`GET /api/public/availability`; param validation → 422; DB failure → 503)
- `src/Modules/Appointments/AppointmentService.php` (transactional booking: `FOR UPDATE` capacity check + insert, `pending`, collision-retried reference)
- `src/Modules/Appointments/AppointmentController.php` (`POST /api/public/appointments`; JSON validation → 422; taken slot → 409)
- `src/Modules/Announcements/AnnouncementsController.php` (TASK-025 public board: pinned-first list, `LIMIT 50`, `posted_at` exposed as `date`)
- `src/Modules/Auth/AuthService.php` (verify + rehash + throttling; lock evaluated on DB clock)
- `src/Modules/Auth/AuthController.php` (`POST login/logout`, `GET me`; Origin check on POSTs)
- `src/Modules/Auth/Session.php` (fixation-safe sessions, idle timeout, destroy)
- `src/Modules/Auth/RequireAuth.php` (TASK-023 auth-only gate: session check → user or fixed 401; no role checks — matrix deferred to TASK-014)
- `src/Modules/Auth/AccessPolicy.php` (TASK-014 default RBAC: module map + `requireModule()`; granular overrides explicitly future)
- `src/Modules/Appointments/AppointmentAdminService.php` (TASK-015 transitions/counts/history queries) + `AppointmentAdminController.php` (401/403/404/422 staff endpoints) + `LookupController.php` (TASK-026 public lookup, timing-safe suffix, identical 404s)
- `tests/appointments_admin_check.php` (TASK-015 CLI test, 28 checks on disposable DB, exit 0)
- `tests/lookup_check.php` (TASK-026 CLI test, 11 checks on disposable DB, exit 0)
- `src/Modules/Services/ServicesAdminService.php` + `ServicesAdminController.php` (TASK-020 edit-only master-data admin, closures CRUD)
- `tests/services_admin_check.php` (TASK-020 CLI test, 32 checks on disposable DB, exit 0)
- `scripts/create_staff.php` (local account upsert; 10+ char passwords; secrets never committed)
- `src/Modules/Appointments/SlotTakenException.php` (taken-slot signal → 409)
- `tests/health_check.php` (CLI smoke test, 9 checks, exit 0), `tests/db_connection_check.php` (CLI test, 23 checks, exit 0), `tests/availability_check.php` (CLI test, 24 checks on disposable DB, exit 0), `tests/appointment_create_check.php` (CLI test, 28 checks on disposable DB, exit 0), `tests/auth_check.php` (CLI test, 13 checks on disposable DB, exit 0), `tests/services_check.php` (CLI test, 7 checks, exit 0)
- Empty dirs (Planned use): `src/Middleware/`, `storage/logs/`

Implemented endpoints: `GET /api/health` (200), `GET /api/health/db` (200/503), `GET /api/public/availability` (200/422/503), `POST /api/public/appointments` (201/409/422/503), `POST /api/auth/login` (200/401/429/403), `POST /api/auth/logout` (200), `GET /api/auth/me` (200/401), `GET /api/public/services` (200), `GET /api/public/announcements` (200), `GET /api/appointments` (200/401/422), `GET /api/appointments/{ref}` (200/401/404), `PATCH /api/appointments/{ref}/status` (200/401/403/404/422), `POST /api/public/appointments/lookup` (200/404/422), `GET /api/services` + `PATCH /api/services/{id}` + `GET /api/schedules` + `PATCH /api/schedules/{id}` + `GET/POST /api/closures` + `DELETE /api/closures/{id}` (200/201/401/403/404/409/422) + safe JSON 404/500; see `docs/API.md`. All frontend reads are live.

## Database tier

Root-level `database/` per `docs/DECISIONS.md` (not `backend/database/`):
- `database/README.md` — Implemented: naming (`YYYYMMDDHHMMSS_description.sql`), apply order, fresh-DB-from-empty + disposable-DB verification procedure
- `database/migrations/00000000000000_template.sql` — Implemented: comment-only template, safe to apply, changes nothing
- `database/migrations/20261016000001…0004` — Implemented files 2026-10-16 (TASK-008): services, schedules, closures, appointments. Live apply Outstanding.
- `database/seeders/README.md` — Implemented: synthetic-only seeding rules
- `database/seeders/20261016000001…0002` — Implemented files 2026-10-16: 6 approved services + Mon–Fri template (reference data, no patient info)

No live database has been touched; implemented tables are file-level until disposable-DB verification runs.

No tables, columns, or constraints exist. Planned entities are listed below.

## Module boundaries (current truth)

| Boundary | Implemented | Planned |
|----------|-------------|---------|
| Browser → Frontend | Yes (static mock UI) | Real API calls replacing mock imports |
| Frontend → API | Partial (mock functions + live `GET /api/health`) | Full PHP REST JSON over HTTPS, narrow CORS |
| API → MySQL | Partial (PDO factory + `SELECT 1` probe; no live DB here) | Full schema queries with prepared statements, transactions |
| Public vs Staff | Partial (routes exist, no auth) | Server-side session + role checks on every protected endpoint |

## What this doc does not do
- Does not scaffold new folders or propose stack changes (see `RULES.md §4`: simplest structure that fits).
- Does not document endpoints or schema — see `docs/API.md`, `docs/DATABASE.md`.

---
## Related notes
- Role: spec — module boundaries + data flow (Implemented vs Planned).
- Governed by: [[RULES]] · [[DEVELOPMENT_PLAN]] · [[docs/DECISIONS|DECISIONS]] (3-tier layout)
- Details in: [[docs/API|API]] · [[docs/DATABASE|DATABASE]] · [[docs/brand-guidelines|brand-guidelines]]
- Verified by: [[docs/TESTING|TESTING]] · Deploys via: [[docs/DEPLOYMENT|DEPLOYMENT]]
- Work queue: [[TASKS]] · State: [[PROGRESS]]
