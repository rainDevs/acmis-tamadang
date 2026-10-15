# ACMIS Testing

Strategy and exact verification commands. Evidence rule (mandatory per `RULES.md §14`): never claim a test passed unless it was actually run and its result observed. State exact commands and outcomes. If a check cannot run, state why and list the outstanding verification.

## Frontend (verified present 2026-10-15)

Source: `frontend/package.json` scripts: `dev` (vite), `build` (vite build), `lint` (oxlint), `preview` (vite preview). No test script exists; no test framework is introduced in this pass.

| Check | Command (run from `frontend/`) | Status 2026-10-15 |
|-------|-------------------------------|-------------------|
| Production build | `npm run build` | Pass (exit 0, ~1.9s, 2539 modules, `dist/` emitted) |
| Lint | `npm run lint` | Pass with 1 warning (exit 0; `button.jsx:62` react fast-refresh warning only) |
| Dev server | `npm run dev` | Exists; not run in this pass (Outstanding if needed) |
| Preview | `npm run preview` | Exists; not run (Outstanding) |

Manual UI checks (required per task, `RULES.md §14`):
- Narrow mobile viewport first, then tablet and desktop; no horizontal overflow.
- Loading, empty, success, validation, and error states for touched flows.
- Keyboard navigation + visible focus for critical forms/dialogs; do not rely on color alone for status.

## Backend (health + DB connection implemented 2026-10-16)

- Runtime available: PHP 8.2.12 CLI verified (`php -v`); PDO drivers present: `pdo_mysql`, `pdo_sqlite`, `mysqli` (verified `php -m` 2026-10-16).
- Syntax: `php -l <file>` per changed file — pass on all 7 new/changed PHP files (verified 2026-10-16).
- CLI smoke tests from repo root: `php backend/tests/health_check.php` — 9/9 PASS, exit 0; `php backend/tests/db_connection_check.php` — 23/23 PASS, exit 0 (verified 2026-10-16).
- Manifest: `composer validate` from `backend/` — valid (verified 2026-10-16).
- Live check: `php -S localhost:8000 -t backend/public`, then `GET /api/health` → 200 + envelope, `GET /api/health/db` → 503 safe `Database unavailable.` (no MySQL here), unknown route → JSON 404 (all three verified live 2026-10-16, server log confirms 200/503/404).
- Outstanding: live 200 from `/api/health/db` against real MySQL (needs provisioned disposable DB).
- Required per future change when endpoints exist: expected status codes + response shapes; invalid input, unauthenticated, and unauthorized requests; safe-error check (no SQL/stack/paths/secrets in responses).

## Database (live MySQL available 2026-10-16)

- Server: local MySQL 8.0.43 (`MySQL80` service); client `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`. Disposable-DB credentials live outside version control (owner-provided per run, transient env only).
- TASK-008 verification (all on disposable `acmis_test`, dropped afterwards): fresh apply of all 5 migration files exit 0; both seeders exit 0; `SHOW TABLES` = 4 tables; 6 services + 5 schedule rows confirmed; valid insert defaults `pending`; same-slot double insert succeeds (by design — API locking in TASK-010); rejections verified: duplicate name 1062, bad FK 1452, bad day 3819, bad window 3819, bad ENUM 1265, delete-referenced-service 1451; transaction rollback returns 0 rows.
- Live API→DB: `GET /api/health/db` → 200 `Database connection is working.` against disposable DB (verified live 2026-10-16, server log confirms).
- TASK-009 verification (disposable `acmis_avail`, dropped afterwards): `php backend/tests/availability_check.php` — 24/24 PASS, exit 0 (18 slots/day shape, pending/approved occupy, cancelled/completed free, closures, weekends, 6× 422 cases, past-date, all-services, leak scan); live `php -S` → 200 with honored params (1 day / 18 slots / 18 left) + 422 `Unknown or inactive service.` (server log confirms 200 + 422).
- Test-harness note: `PDO::exec()` on a result-producing statement (template's `SELECT 1`) hard-crashes this PHP 8.2.12/mysqlnd build with no message (exit 255); harness uses `query()` + `closeCursor()` instead. The template file itself is fine via the mysql client.
- Backend native-prepare rule: MySQL native prepares reject a reused named placeholder in one statement (`HY093`) — `slotCapacity()` uses distinct `:time_lo`/`:time_hi`. Audit new multi-occurrence parameters the same way.
- TASK-010 verification (disposable `acmis_book`, dropped afterwards): `php backend/tests/appointment_create_check.php` — 27/27 PASS, exit 0 (201 shape + persistence, 409 double-book with single occupying row, cancelled re-book with distinct refs, 12× 422, same-day past/future with fixed clock, leak scan); live `php -S` → valid POST 201 (`ACMIS-2026-030390`, pending), repeat 409, bad mobile 422, availability regression 200 (server log confirms 201 + 409 + 422 + 200). Only disposable `acmis_*` databases were created/touched/dropped; pre-existing server databases were never modified.
- Outstanding: none for TASK-010. Future endpoints repeat this disposable-DB procedure.
- TASK-011 verification: `GET /api/public/services` — `php backend/tests/services_check.php` 7/7 PASS exit 0 on disposable DB (6 approved rows, uniform 30, inactive hidden), live 200. Booking UI — `npm run build` exit 0, `npm run lint` exit 0 (only the pre-existing warning; 2 new warnings fixed, not suppressed). Live E2E over the exact UI paths on disposable `acmis_e2e` (dropped after): services 200 (6 rows) → availability 200 (18 slots) → POST 201 (`ACMIS-2026-480672`) → row persisted `pending` (server log confirms 200 + 200 + 201). Limitation: no browser tooling here — click-through interaction verified by code review only (states, guards, 409 recovery path); real click-through belongs to TASK-012.

## End-to-end (no slice implemented)

- Full vertical slice check when available: public request → staff review → approve/reject → persisted state + audit history; unauthorized access denied; patient/consultation data protected. Mock responses never count as integration evidence.

## Reporting results
- Record command, working directory, exit code, and observed outcome.
- Do not weaken or delete tests to get green. Unverified behavior stays disclosed in `PROGRESS.md` / task reports.

---
## Related notes
- Role: verification — exact commands + evidence rule (never claim pass without run).
- Governed by: [[RULES]] · [[DEVELOPMENT_PLAN]]
- Covers: [[docs/ARCHITECTURE|ARCHITECTURE]] · [[docs/API|API]] · [[docs/DATABASE|DATABASE]] · [[docs/DEPLOYMENT|DEPLOYMENT]]
- Work queue: [[TASKS]] · State: [[PROGRESS]]
