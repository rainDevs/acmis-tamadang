# ACMIS Project Progress
- Current phase: Phase 1 — Technical foundation catch-up (frontend-first resequence; TASK-016 In Progress, backend paused)
- Current task: None (dev DB `acmistamadangdb` ready — owner verifying frontend; next: TASK-017 staff screens or TASK-012 click-through findings)
- Overall status: Public booking slice complete end-to-end (UI → API → MySQL, all live-verified). 5 endpoints live. Lookup + announcements still mock; no auth yet.
- Last verified change: TASK-010 — creation endpoint, 27/27 CLI checks on disposable DB, live 201 + 409 + 422 (server log confirms), disposable DBs dropped
- Last verification date: 2026-10-16

## Completed
- [x] TASK-901…908 — project-control baseline (see prior entries; all checkpoints checked)
- [x] TASK-002 — Frontend verified (pre-existing). `npm run build` exit 0; `npm run lint` exit 0 (1 known warning `button.jsx:62`).
- [x] TASK-003 — PHP API + `GET /api/health` (verified live 200 + safe 404).
- [x] TASK-004 — Env config + gitignore (placeholders only; no real `.env` tracked).
- [x] TASK-005 — Migration workflow established (comment-only template; live apply Outstanding).
- [x] TASK-006 — Docs baseline refreshed.
- [x] TASK-007 — DB connection + error conventions (health + `/api/health/db` probes, `ApiError` safe envelopes; verified 2026-10-16: CLI tests 9/9 + 23/23 PASS, live 200/503/404).
- [x] TASK-008 — Services/availability schema live-verified on disposable MySQL 8.0.43 (`acmis_test`, dropped after): 5 migrations apply exit 0, 2 seeders exit 0, 4 tables / 6 services / 5 schedule rows confirmed, valid insert defaults `pending`, 6 rejections with expected codes, rollback returns 0 rows, live `/api/health/db` 200.
- [x] TASK-009 — Public availability endpoint (24/24 CLI PASS, live 200 + 422; `$_GET`-on-null fix).
- [x] TASK-010 — Public appointment creation endpoint (27/27 CLI PASS, live 201 + 409 + 422; `HY093` placeholder fix).
- [x] TASK-011 — Booking UI live + services endpoint. Frontend: `BookingFlow` (service → schedule → details → review → confirmation), 5 step components, `RequestPage` rewrite, `api.js` cutover (services/availability/submit live; lookup + announcements stay mock), landing icon/description fixes. Backend: `GET /api/public/services` + `tests/services_check.php`. Verified: build 0, lint 0 (pre-existing warning only), services CLI 7/7, live E2E services 200 → availability 200 → POST 201 → row `pending` (server log confirms). Credentials transient env only, cleared; disposable DBs dropped. Polish 2026-10-16: `StepPanel` transition (opacity + 16px, 0.25s, reduced-motion instant) + step-heading focus management; build 0, lint 0.
- [x] TASK-016 — Design foundation. Brand tokens in theme (emerald primary/ring, cyan accent, dark-mode covered); `Button lg` 44px; new `Field`/`TextInput`/`FormError`, `LoadingState`, `EmptyState`, Radix `Modal`, `StaffLayout` shell, live `request()` helper (mocks untouched). All `bg-emerald-*` one-offs routed through tokens; `StatusLookupForm` refactored onto patterns. Verified: `npm run build` exit 0, `npm run lint` exit 0 (1 pre-existing warning). Limitation: no browser tooling here — 360px/keyboard checks by class audit only (unprefixed mobile baseline, `sm:` enhancements, skip link, focus rings, `role=alert`/`aria-live`); real-device pass deferred to TASK-011/012.

## In progress
- None

## Blocked / decisions needed
- TASK-001 remaining: Q-06 correction policy, Q-07 privacy approval, Q-08 notifications, Q-09 hosting, Q-10 RTO/RPO — owner: health center (+ legal review for Q-07).
- RULES.md §4 / DEVELOPMENT_PLAN.md §3 diagrams still show `database/` under `backend/` — diagram fix needs approval (deferred, recorded in DECISIONS.md).

## Known issues
- `npm run lint` emits 1 non-blocking warning (`button.jsx:62` fast-refresh).
- Backend has no auth, lookup endpoint, or staff wiring yet (TASK-013/015/017 next).
- `PDO::exec()` on result-producing statements crashes this PHP/mysqlnd build silently (exit 255) — test harness uses `query()` + `closeCursor()` (see `docs/TESTING.md`).

## Next recommended task
- TASK-017 staff screens (needs detailing to Ready) → resume backend at TASK-013. TASK-012 end-to-end click-through needs a browser/human — available anytime.

---
## Related notes
- Role: state — current truth + next task (mirrors [[TASKS]]).
- Governed by: [[RULES]] · [[docs/DECISIONS|DECISIONS]] · [[DEVELOPMENT_PLAN]]
- Queue: [[TASKS]] · History: [[tasks/plan|plan]]
- Specs: [[docs/ARCHITECTURE|ARCHITECTURE]] · [[docs/API|API]] · [[docs/DATABASE|DATABASE]] · Verified by: [[docs/TESTING|TESTING]] · Deploys via: [[docs/DEPLOYMENT|DEPLOYMENT]]
