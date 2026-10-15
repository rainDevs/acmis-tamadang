# ACMIS Architecture

Status: Baseline 2026-10-15. Frontend mock-only; backend and database tiers have folder skeletons with zero code files. See `docs/DECISIONS.md` (2026-10-15 3-tier layout) for the authoritative root layout: `backend/`, `database/`, `docs/`, `frontend/`.

## Data flow

Implemented today: `Browser → React mock (no network backend)`.

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

## Backend — Implemented skeleton + health + DB connection + availability + booking (16 files, 2026-10-16)

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
- `src/Modules/Appointments/SlotTakenException.php` (taken-slot signal → 409)
- `tests/health_check.php` (CLI smoke test, 9 checks, exit 0), `tests/db_connection_check.php` (CLI test, 23 checks, exit 0), `tests/availability_check.php` (CLI test, 24 checks on disposable DB, exit 0), `tests/appointment_create_check.php` (CLI test, 27 checks on disposable DB, exit 0)
- Empty dirs (Planned use): `src/Middleware/`, `storage/logs/`

Implemented endpoints: `GET /api/health` (200), `GET /api/health/db` (200/503), `GET /api/public/availability` (200/422/503), `POST /api/public/appointments` (201/409/422/503) + safe JSON 404/500; see `docs/API.md`. No auth, lookup, status workflow, or UI wiring.

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
