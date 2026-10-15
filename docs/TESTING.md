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

## Backend (health endpoint implemented 2026-10-15)

- Runtime available: PHP 8.2.12 CLI verified (`php -v`).
- Syntax: `php -l <file>` per changed file — pass on all 5 new PHP files (verified 2026-10-15).
- CLI smoke test: `php backend/tests/health_check.php` from repo root — 9/9 PASS, exit 0 (verified 2026-10-15).
- Manifest: `composer validate` from `backend/` — valid (verified 2026-10-15).
- Live check: `php -S localhost:8000 -t backend/public`, then `GET /api/health` → 200 + envelope, unknown route → JSON 404 (both verified live 2026-10-15).
- Required per future change when endpoints exist: expected status codes + response shapes; invalid input, unauthenticated, and unauthorized requests; safe-error check (no SQL/stack/paths/secrets in responses).

## Database (workflow established, no live MySQL here)

- Disposable/test-database procedure: documented in `database/README.md` (pending TASK-005 live verify). When migrations land: apply to an empty disposable database; verify FKs, unique constraints, indexes; test transactions/rollback; test duplicate + invalid input; test capacity + concurrent-booking protection where relevant; confirm clean-DB-from-migrations works using the documented procedure.
- Outstanding: no MySQL verification performed (no MySQL CLI in this environment as of 2026-10-15; template file is comment-only by design).

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
