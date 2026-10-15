# ACMIS Project Progress
- Current phase: Phase 0 — Requirements and project setup (bundle complete)
- Current task: None (next: TASK-001 clinic-rules confirmation — BLOCKED on health-center input — or TASK-007 DB connection)
- Overall status: Phase 0 bundle Done. Frontend builds; `GET /api/health` live-verified; env + migration workflow established; all 10 control files present. No auth, no schema, no business logic yet.
- Last verified change: TASK-002…006 bundle — backend health endpoint, env config, migration workflow, docs refresh
- Last verification date: 2026-10-15

## Completed
- [x] TASK-901…908 — project-control baseline (see prior entries; all checkpoints checked)
- [x] TASK-002 — Frontend verified (pre-existing). `npm run build` exit 0 (~1.5s, dist/ emitted); `npm run lint` exit 0 (1 known warning `button.jsx:62` fast-refresh). No UI changes made.
- [x] TASK-003 — PHP API + `GET /api/health` implemented (6 files: `composer.json`, `public/index.php`, `src/Shared/Response.php`, `src/Routes/api.php`, `src/Modules/Health/HealthController.php`, `tests/health_check.php`). Verified: `php -l` 5/5 clean; CLI test 9/9 PASS exit 0; `composer validate` valid; live `php -S` → `/api/health` 200 + envelope, `/api/nope` JSON 404 with no leaks.
- [x] TASK-004 — Env config + gitignore. Root `.gitignore` + `backend/.env.example` + `frontend/.env.example` (placeholders only). Verified: no real `.env` files exist; migrations path not ignored.
- [x] TASK-005 — Migration workflow established (`database/README.md`, comment-only `migrations/00000000000000_template.sql`, `seeders/README.md` synthetic-only). Verified: file review; live apply Outstanding (no MySQL here).
- [x] TASK-006 — Docs refreshed: ARCHITECTURE (backend 6 files), API (`/api/health` Implemented), DATABASE (workflow + zero real migrations), TESTING (PHP commands + outcomes), DEPLOYMENT (env facts), DECISIONS (Phase 0 bundle entry).

## In progress
- None

## Blocked / decisions needed
- TASK-001 clinic rules (services, hours, capacity, approval flow, duplicate-patient process, roles, consultation fields, privacy/retention, notifications, hosting/RTO) — owner: health center; do not invent. Blocks TASK-008+ schema/API work.
- Live migration apply on disposable MySQL — needs MySQL available; owner: whoever provisions dev DB.
- RULES.md §4 / DEVELOPMENT_PLAN.md §3 diagrams still show `database/` under `backend/` — diagram fix needs approval (deferred, recorded in DECISIONS.md).

## Known issues
- `npm run lint` emits 1 non-blocking warning (`button.jsx:62` fast-refresh).
- Backend has no DB, auth, or business logic by design (deferred to TASK-007+).
- `database/` has zero real migrations (template only) by design until TASK-001 resolves.

## Next recommended task
- TASK-001 — Confirm clinic rules with the health center (questionnaire + record answers in DECISIONS.md); reason: it gates every schema, endpoint, and workflow task (TASK-008…015). If owner input is unavailable, next buildable step is TASK-007 (DB connection + error conventions) on a disposable database.

---
## Related notes
- Role: state — current truth + next task (mirrors [[TASKS]]).
- Governed by: [[RULES]] · [[docs/DECISIONS|DECISIONS]] · [[DEVELOPMENT_PLAN]]
- Queue: [[TASKS]] · History: [[tasks/plan|plan]]
- Specs: [[docs/ARCHITECTURE|ARCHITECTURE]] · [[docs/API|API]] · [[docs/DATABASE|DATABASE]] · Verified by: [[docs/TESTING|TESTING]] · Deploys via: [[docs/DEPLOYMENT|DEPLOYMENT]]
