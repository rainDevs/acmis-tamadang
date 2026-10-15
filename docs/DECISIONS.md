# ACMIS Decisions

Approved technical and business decisions. Precedence: `RULES.md` > this file > `DEVELOPMENT_PLAN.md` > `TASKS.md` > existing code. Do not invent clinic policy, roles, or legal conclusions here; record open questions in `PROGRESS.md` Blocked section instead.

Entry format: Date | Decision | Rationale | Owner/Approver | Affected tasks.

---

## 2026-10-15 — 3-tier repository layout with `database/` at project root
- Decision: Root folders are `backend/`, `database/`, `docs/`, `frontend/`. The `database/` folder (with `migrations/`, `seeders/`) lives at the project root, not under `backend/`.
- Rationale: 3-tier architecture separation (presentation / application / data) requested by project owner; database tier is independent of backend application code.
- Owner/Approver: Project owner (executed move `backend/database/` → `database/` on 2026-10-15)
- Affected tasks: TASK-903, TASK-904, TASK-906
- Note: Diagrams in `RULES.md §4` and `DEVELOPMENT_PLAN.md §3` still depict `database/` under `backend/`. Diagram edits are deferred to a later approved task; this entry is the ground truth until then.

## 2026-10-15 — Frontend mock API is temporary scaffolding only
- Decision: `frontend/src/services/api.js` + `frontend/src/services/mockData.js` are mock-only stand-ins with the `{ success, message, data }` envelope. They are not evidence of backend functionality and must never be treated as integration proof.
- Rationale: Allows frontend-first mobile UI work before the PHP REST API exists; mock shapes mirror `DEVELOPMENT_PLAN.md §9` Planned contracts for drop-in replacement.
- Owner/Approver: Project owner (baseline state observed 2026-10-15)
- Affected tasks: TASK-905, TASK-011 (future), TASK-012 (future)
- Privacy constraint: Public lookup mock returns status + schedule only; contact suffix is filtered out before returning.

## 2026-10-15 — Technology stack locked
- Decision: Stack is React 19 + Vite 8 + JavaScript + Tailwind v4 + shadcn/ui (frontend), PHP REST API + PDO (backend), MySQL with version-controlled SQL migrations (database), per `RULES.md §3` / `DEVELOPMENT_PLAN.md §2`.
- Rationale: Fixed baseline unless explicitly approved and recorded here.
- Owner/Approver: Project owner
- Affected tasks: All product tasks (TASK-001…015 future)

## 2026-10-15 — Bootstrap task IDs use 900-series
- Decision: Project-control bootstrap tasks are `TASK-901…908`; product backlog retains `TASK-001…015` numbering from `DEVELOPMENT_PLAN.md §15`.
- Rationale: Avoid ID collision between one-time control-file work and repeatable product work.
- Owner/Approver: Project owner (via plan `tasks/plan.md`)
- Affected tasks: TASK-901…908

## 2026-10-15 — Phase 0 bundle: health endpoint, env config, migration workflow
- Decision: Implemented minimal dependency-free PHP API (`GET /api/health` only), placeholder-only env examples + root `.gitignore`, and a documented migration workflow with a comment-only template (no real schema until TASK-001 rules are confirmed in TASK-008).
- Rationale: Unblocks frontend→backend integration testing and establishes secrets/migration hygiene before any business logic lands; avoids inventing clinic policy, schema, or contracts.
- Owner/Approver: Project owner (Full Phase 0 bundle selected 2026-10-15)
- Affected tasks: TASK-002…006
- Outstanding: live migration apply on a disposable MySQL database (no MySQL in this environment); production hosting/RTO/RPO unchanged.

---
## Related notes
- Role: authority log — approved ground truth (`RULES > DECISIONS > PLAN > TASKS`).
- Governed by: [[RULES]] · [[DEVELOPMENT_PLAN]]
- Tracks: [[TASKS]] · [[PROGRESS]]
- Details in: [[docs/ARCHITECTURE|ARCHITECTURE]] · [[docs/API|API]] · [[docs/DATABASE|DATABASE]] · [[docs/TESTING|TESTING]] · [[docs/DEPLOYMENT|DEPLOYMENT]]
- History: [[tasks/plan|plan]]
