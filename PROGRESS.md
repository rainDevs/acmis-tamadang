# ACMIS Project Progress
- Current phase: Phase 0 — Requirements and project setup
- Current task: None (control-file baseline complete; next: detail product backlog TASK-001…015)
- Overall status: All 10 project-control files present. Frontend mock-only; no backend endpoints; no migrations. Verified 2026-10-15.
- Last verified change: TASK-907…908 created `docs/TESTING.md` + `docs/DEPLOYMENT.md`; `npm run build` pass, `npm run lint` pass (1 warning)
- Last verification date: 2026-10-15

## Completed
- [x] TASK-901 — TASKS.md backlog initialized with TASK-901…908 in mandatory format. Verified: file exists at repo root.
- [x] TASK-902 — PROGRESS.md baseline created. Verified: file exists; claims cross-checked against `frontend/src/services/api.js`, empty `backend/`, empty `database/`.
- [x] TASK-903 — docs/DECISIONS.md baseline created (3-tier root `database/`, mock-only frontend, stack lock, 900-series IDs). Verified: file exists; `database/` at root True, `backend/database/` absent True.
- [x] TASK-904 — docs/ARCHITECTURE.md baseline created. Verified: file exists; spot paths (`routes/index.jsx`, `services/api.js`, `backend/src/Config`, `database/migrations`) all True; `brand-guidelines.md` unmodified (1671 bytes).
- [x] TASK-905 — docs/API.md baseline created (zero endpoints implemented; mock-to-Planned mapping). Verified: file exists; mock functions `getServices`, `getAvailabilitySummary`, `lookupAppointment`, `submitAppointment` confirmed in `api.js`.
- [x] TASK-906 — docs/DATABASE.md baseline created (zero migrations; all entities Planned). Verified: file exists; `database/` contains 0 files.
- [x] TASK-907 — docs/TESTING.md baseline created. Verified: file exists; `npm run build` exit 0 (~1.9s, 2539 modules); `npm run lint` exit 0 (1 fast-refresh warning `button.jsx:62`); PHP 8.2.12 CLI available.
- [x] TASK-908 — docs/DEPLOYMENT.md baseline created (no prod; no root .gitignore; no .env.example files). Verified: file exists; no credentials invented.

## In progress
- None

## Blocked / decisions needed
- Which appointment services are offered? — needed for TASK-008; owner: health center (per DEVELOPMENT_PLAN.md §16)
- Operating hours, holidays, slot durations, capacity rules? — needed before encoding scheduling logic; owner: health center
- Are requests always pending staff approval? — needed for workflow; owner: health center
- Duplicate patient identification/resolution process? — needed for Phase 5; owner: health center
- Staff roles and per-role read/write permissions? — needed for TASK-013/014; owner: health center
- Required consultation fields + correction/audit policy? — needed for Phase 6; owner: health center
- Privacy notice, retention period, authorized disclosure process? — needed before launch; owner: responsible organization
- SMS/email notifications (provider, cost approval)? — deferred enhancement; owner: project owner
- Production hosting, maintainer, backup protection, RTO/RPO? — needed for Phase 9; owner: project owner
- RULES.md §4 / DEVELOPMENT_PLAN.md §3 diagrams still show `database/` under `backend/` — recorded in DECISIONS.md; diagram fix needs approval (deferred)

## Known issues
- Backend skeleton contains zero code files; no endpoint implemented.
- `database/migrations/` and `database/seeders/` empty; no schema implemented.
- Frontend uses mock API only; no real backend integration.
- No root `.gitignore`; no `.env.example` files (documented as Outstanding in DEPLOYMENT.md).
- `npm run lint` emits 1 non-blocking warning (`button.jsx:62` fast-refresh).

## Next recommended task
- Detail product backlog TASK-001…015 (follow-up planning pass, per tasks/plan.md Open Questions) — reason: control-file baseline is Done; Phase 0 product work (TASK-001 confirm business rules) is the next dependency-safe step and blocks schema/API design.
