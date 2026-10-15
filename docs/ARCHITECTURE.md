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

## Backend — Planned (skeleton only, zero code files)

Observed `backend/` on 2026-10-15 (all directories empty of files):
- `public/` (Planned: front controller `index.php`)
- `src/Config/`, `src/Database/`, `src/Middleware/`, `src/Modules/`, `src/Routes/`, `src/Shared/` (Planned: controllers/services/repositories/validation per `DEVELOPMENT_PLAN.md §3`)
- `storage/logs/` (Planned: safe server-side logs, no secrets/medical notes)
- `tests/` (Planned: PHP syntax + API tests)

No PHP files exist. No endpoint is implemented.

## Database tier — Planned (skeleton only, zero migrations)

Root-level `database/` per `docs/DECISIONS.md` (not `backend/database/`):
- `database/migrations/` — Implemented: empty directory; Planned: version-controlled SQL migrations
- `database/seeders/` — Implemented: empty directory; Planned: synthetic seeds only

No tables, columns, or constraints exist. Planned entities are listed in `docs/DATABASE.md`.

## Module boundaries (current truth)

| Boundary | Implemented | Planned |
|----------|-------------|---------|
| Browser → Frontend | Yes (static mock UI) | Real API calls replacing mock imports |
| Frontend → API | No (mock functions only) | PHP REST JSON over HTTPS, narrow CORS |
| API → MySQL | No | PDO prepared statements, transactions |
| Public vs Staff | Partial (routes exist, no auth) | Server-side session + role checks on every protected endpoint |

## What this doc does not do
- Does not scaffold new folders or propose stack changes (see `RULES.md §4`: simplest structure that fits).
- Does not document endpoints or schema — see `docs/API.md`, `docs/DATABASE.md`.
