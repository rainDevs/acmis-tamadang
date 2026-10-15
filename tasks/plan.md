# Implementation Plan: Project-Control Files Baseline

## Overview
Create the 8 missing project-control files required by `DEVELOPMENT_PLAN.md §10.1` / `RULES.md §15-17`, without fabricating implementation details. Repo currently has `RULES.md`, `DEVELOPMENT_PLAN.md`, `docs/brand-guidelines.md`, a mock-only React frontend (`frontend/src/services/api.js` + `mockData.js`), empty `backend/` skeleton folders, and empty `database/migrations|seeders/` (now at project root after 3-tier move). The 8 files to create are `TASKS.md`, `PROGRESS.md`, `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/DATABASE.md`, `docs/DECISIONS.md`, `docs/TESTING.md`, `docs/DEPLOYMENT.md`.

Tasks tracked in `TASKS.md` (project-designated tracker per `DEVELOPMENT_PLAN.md §15` / `RULES.md §16`), not `tasks/todo.md`. This file is the plan index only.

## Architecture Decisions
- Task list target = `TASKS.md` at repo root (project convention overrides skill default `tasks/todo.md`). Noted here so downstream sessions know where to look.
- Bootstrap task IDs = `TASK-901…908` to avoid colliding with product backlog `TASK-001…015` suggested in `DEVELOPMENT_PLAN.md §15`. Rationale recorded in `TASKS.md` header.
- `docs/DECISIONS.md` comes first (after `TASKS.md`/`PROGRESS.md`) because it records the already-executed 3-tier move (`backend/database/` → `database/`) which contradicts the diagrams in `RULES.md §4` / `DEVELOPMENT_PLAN.md §3` (both show `database/` under `backend/`). All later docs must reference the root-level `database/` truth.
- All baseline docs mark Implemented vs Planned explicitly. Frontend mock contracts are Planned, not Implemented. No migrations, no PHP endpoints, no auth exist yet — docs must say so.
- No code changes in this plan. Docs-only. Each task touches 1 file.

## Dependency Graph
```
TASKS.md (901, Done by this plan)
  ├── PROGRESS.md (902)
  └── DECISIONS.md (903: records database/ at root)
        ├── ARCHITECTURE.md (904)
        ├── API.md (905: mock-only, no real endpoints)
        └── DATABASE.md (906: planned entities, zero migrations)
              ├── TESTING.md (907: exact commands only)
              └── DEPLOYMENT.md (908: local XAMPP, no prod yet)
```

## Task List (index — full definitions in TASKS.md)

### Phase 1: Tracker + ground truth
- [x] TASK-901: Initialize TASKS.md (this plan writes it)
- [ ] TASK-902: Create PROGRESS.md baseline
- [ ] TASK-903: Create docs/DECISIONS.md baseline

### Checkpoint: Ground truth
- [ ] TASKS.md + PROGRESS.md + DECISIONS.md exist, agree on root layout (backend, database, docs, frontend)
- [ ] 3-tier move recorded; contradictions with RULES/DEVELOPMENT_PLAN diagrams noted, not silently edited
- [ ] Review with human before parallel docs pass

### Phase 2: Current-state docs (parallelizable after 903)
- [ ] TASK-904: docs/ARCHITECTURE.md — actual boundaries + data flow
- [ ] TASK-905: docs/API.md — Planned contracts only
- [ ] TASK-906: docs/DATABASE.md — Planned schema + migration workflow

### Checkpoint: State docs
- [ ] No fabricated endpoints/tables; Implemented vs Planned labels present
- [ ] Frontend mock files, empty backend/, empty database/ accurately described

### Phase 3: Verification + ops docs
- [ ] TASK-907: docs/TESTING.md — exact commands only
- [ ] TASK-908: docs/DEPLOYMENT.md — env setup, no-prod-yet truth

### Checkpoint: Complete
- [ ] All 8 files exist at required paths
- [ ] Each doc cross-links RULES.md + DEVELOPMENT_PLAN.md sections, no invented policy
- [ ] Ready for Phase 0 product work (TASK-001…015 detailed separately)

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Fabricating API/schema details for non-existent backend | High | Acceptance criterion per task: Planned-labeled, sourced from DEVELOPMENT_PLAN §7/§9 + frontend mock files only |
| TASK-ID collision with DEVELOPMENT_PLAN §15 (001–015) | Med | 900-series for bootstrap; rationale in TASKS.md header + here |
| Contradiction: RULES/PLAN diagrams show database/ under backend/ | Med | DECISIONS.md records root-level move first; other docs reference DECISIONS, don't edit RULES/PLAN in this pass |
| Overwriting docs/brand-guidelines.md | Low | Out-of-scope in every task; verification checks it is unmodified |
| Scope creep into implementing backend/frontend | Med | Out-of-scope clause per task; docs-only, no code |

## Open Questions
- Should RULES.md §4 + DEVELOPMENT_PLAN.md §3 diagrams be updated to root-level `database/` in this pass or a separate decision task? (Plan assumes: record in DECISIONS.md only, defer diagram edits.)
- Should product backlog TASK-001…015 from DEVELOPMENT_PLAN §15 be expanded into TASKS.md now or in a follow-up planning pass? (Plan assumes: follow-up; TASKS.md references them as Unscheduled.)
- Exact frontend build/test commands verified? `package.json` has `build: vite build`, `lint: oxlint` — TESTING.md task must run them to confirm before documenting.

## Parallelization Opportunities
- Safe to parallelize after TASK-903: 904, 905, 906 (independent files, shared DECISIONS ground truth).
- 907 + 908 after 904–906 (need architecture/API/DB truth to write correct commands).
- Must be sequential: 901 → 902/903 → rest. No migrations/shared-state concerns (docs-only).

## Verification (plan-level, per skill)
- [ ] Every task has acceptance criteria — yes, in TASKS.md per mandatory §10.3 format
- [ ] Every task has verification step — yes, exact commands + file-exists checks
- [ ] Dependencies ordered correctly — yes, graph above
- [ ] Tasks recorded in task list target — yes, TASKS.md (project-designated, noted here)
- [ ] No pre-existing incomplete plan overwritten — verified: no `tasks/` dir, no `TASKS.md` existed before this plan
- [ ] No task touches more than ~5 files — all touch 1 file
- [ ] Checkpoints exist between phases — yes, 3 checkpoints
- [ ] Human review required before implementation — pending

---
## Related notes
- Role: history — bootstrap plan index that created TASK-901…908 (superseded by [[TASKS]]).
- Governed by: [[RULES]] · [[DEVELOPMENT_PLAN]]
- Queue: [[TASKS]] · State: [[PROGRESS]] · Authority: [[docs/DECISIONS|DECISIONS]]
