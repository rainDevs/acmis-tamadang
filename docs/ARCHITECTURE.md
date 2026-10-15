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

Observed `frontend/src/` on 2026-10-15:
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

## Backend — Implemented skeleton + health endpoint (6 files, 2026-10-15)

Observed `backend/` on 2026-10-15:
- `composer.json` (package `acmis/backend`, php >=8.1, PSR-4 `App\` → `src/`, zero dependencies; `composer validate` clean)
- `public/index.php` (front controller; serve: `php -S localhost:8000 -t backend/public`)
- `src/Shared/Response.php` (`App\Shared\Response::json()` envelope helper)
- `src/Routes/api.php` (route map; currently `GET /api/health` only)
- `src/Modules/Health/HealthController.php` (liveness probe, no DB/auth)
- `tests/health_check.php` (CLI smoke test, 9 checks, exit 0 verified)
- Empty dirs (Planned use): `src/Config/`, `src/Database/`, `src/Middleware/`, `storage/logs/`

Only `GET /api/health` (+ safe JSON 404) is implemented; see `docs/API.md`.

## Database tier — workflow established, zero real migrations (2026-10-15)

Root-level `database/` per `docs/DECISIONS.md` (not `backend/database/`):
- `database/README.md` — Implemented: naming (`YYYYMMDDHHMMSS_description.sql`), apply order, fresh-DB-from-empty + disposable-DB verification procedure
- `database/migrations/00000000000000_template.sql` — Implemented: comment-only template, safe to apply, changes nothing
- `database/seeders/README.md` — Implemented: synthetic-only seeding rules
- Zero real migrations or seeds exist (verified: no other files under `database/`).

No tables, columns, or constraints exist. Planned entities are listed below.

## Module boundaries (current truth)

| Boundary | Implemented | Planned |
|----------|-------------|---------|
| Browser → Frontend | Yes (static mock UI) | Real API calls replacing mock imports |
| Frontend → API | Partial (mock functions + live `GET /api/health`) | Full PHP REST JSON over HTTPS, narrow CORS |
| API → MySQL | No | PDO prepared statements, transactions |
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
