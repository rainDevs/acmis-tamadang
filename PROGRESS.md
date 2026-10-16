# ACMIS Project Progress
- Current phase: Phase 1 — Technical foundation catch-up (frontend-first resequence; TASK-016 In Progress, backend paused)
- Current task: None (next: TASK-018 residents/patients — needs patient-field confirmation; TASK-022 user admin; TASK-021 announcement workflow)
- Overall status: Staff sign-in/out live-verified (sessions, throttling, lockout, Origin check). 8 endpoints live. Appointment data still mock; admin wiring next.
- Overall status: Public booking slice complete end-to-end (UI → API → MySQL, all live-verified). 5 endpoints live. Lookup + announcements still mock; no auth yet.
- Last verified change: TASK-020 — services management live (7 admin endpoints + UI, server log confirms 200/201/409/401 flow)
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
- [x] TASK-011 — Booking UI live + services endpoint (build/lint clean; live E2E 200 → 200 → 201).
- [x] TASK-012 — Public booking E2E, verified 2026-10-16 on fresh disposable `acmis_e2e12` (dropped after): 8 migrations + 2 seeders exit 0; live services 200 (6 rows) → availability 200 (18/18) → POST 201 `ACMIS-2026-349037` pending → re-query 17 left → repeat 409 → bad-mobile/bad-service 422s → exactly 1 persisted row, leak scan clean (server log confirms all codes); `npm run build` exit 0, `npm run lint` exit 0 (1 pre-existing warning).
- [x] TASK-017 — Staff screens (mock-backed design-ahead; login form since converted to live in TASK-013). Plus 2026-10-16: six-module dashboard (`/admin`, live Requests tile + 5 honest Soon previews), staff nav, login lands on dashboard. Mobile nav polish: header is logo + avatar only (Dashboard/Requests header buttons removed); mobile hamburger opens a modal drawer reusing the sidebar; avatar dropdown holds Profile (live session data), theme toggle, sign out.
- [x] TASK-013 — Staff authentication + session security. Backend: `AuthService` (hash verify + rehash + throttling, DB-clock locks), `Session` (fixation-safe, idle timeout), `AuthController` (login/logout/me, Origin check), `create_staff.php` (now loads `backend/.env`), 2 migrations (applied to dev DB). Frontend: live session provider + login form + `request()` credentials. Verified: CLI 13/13; live login 200 → me 200 → logout → me 401, identical 401s, 429 lockout, 403 spoof, cross-origin cookie session lifecycle. Debugging: fixed test-duplicate-username, test-lock-on-ghost, and TZ-fragile lock comparison. Dev admin `admin` on `acmistamadangdb` (password reported, rotatable). 2026-10-16: owner-requested `superadmin` (Super Admin, superadmin role, App Developer Account note) provisioned via script; verified 11/11 (fields + password_verify + AuthService login, no hash leak, hash never committed).
- [x] TASK-023 — Staff auth enforcement foundation (no role matrix). `RequireAuth::check()` gate: guests → fixed 401, sessions pass user through hash-free. Verified: `php -l` clean, CLI 6/6 PASS, live guest `me` 401 + `health` 200 (server log confirms 401/401/200). Deactivation-timing limitation documented in code; matrix stays in blocked TASK-014.
- [x] TASK-024 — Request-review role rule (owner-approved 2026-10-16). `requireRoles()` + `APPOINTMENT_REVIEW_ROLES` (superadmin/admin approve, staff view-only); review UI + queue description role-aware (fail-closed). Verified: CLI 11/11 PASS, build/lint exit 0. Server enforcement lands on the real endpoint in TASK-015.
- [x] TASK-025 — Announcements live on DB. Migration + seeder (same 4 board rows), public `GET /api/public/announcements` (pinned-first, `LIMIT 50`), board UI reads live. Verified: CLI 9/9, live 200 on disposable DB (dropped), dev DB seeded 4 rows, build/lint exit 0. Admin CRUD stays in blocked TASK-021.
- [x] TASK-015 — Appointment administration live. `appointment_status_history` table; staff `GET /api/appointments` (filters/pagination/counts, contact hidden), `GET /api/appointments/{ref}` (full + history), `PATCH …/status` (transitions + reason + actor history, superadmin/admin only per approved rule). Staff queue/detail/dashboard/sidebar all read live; `mockStaffData.js` deleted. Verified: CLI 28/28, live cookiejar 200→200→200→200→422→200→401, build/lint exit 0.
- [x] TASK-026 — Public status lookup live. `POST /api/public/appointments/lookup` (reference + contact-suffix POST body, timing-safe compare, identical 404s, 5-key minimal response); form wired live, mock hint removed. Verified: CLI 11/11, live 200 + 404, build/lint exit 0. No schema change.
- [x] TASK-027 — Demo removal complete (2026-10-16). `mockData.js` deleted (zero importers), `demoUser` → `sessionUser` in session + 5 consumers, stale comments/copy fixed, `docs/ARCHITECTURE.md` + `docs/API.md` describe the live state; post-change grep confirms zero demo/mock markers under `frontend/src`. Verified: `npm run build` exit 0, `npm run lint` exit 0 (1 pre-existing warning).
- [x] TASK-014 — Default RBAC enforcement (2026-10-16). Central `AccessPolicy` module map + `requireModule()` from the approved Q-05 matrix (default matrix; granular overrides explicitly future); PATCH status reuses it. Verified: CLI 48/48, `require_auth` 11/11 + `appointments_admin` 28/28 re-pass. No route/schema/frontend change.
- [x] TASK-020 — Services management live (2026-10-16). Seven admin+ endpoints (services GET/PATCH edit-only, schedules GET/PATCH edit-only, closures GET/POST/DELETE) + admin Services page + sidebar link (hidden for staff). Verified: CLI 32/32, live cookiejar 200/200/200/200/201/409/200/401/200/401, build/lint exit 0. No schema change.
- [x] TASK-016 — Design foundation. Brand tokens in theme (emerald primary/ring, cyan accent, dark-mode covered); `Button lg` 44px; new `Field`/`TextInput`/`FormError`, `LoadingState`, `EmptyState`, Radix `Modal`, `StaffLayout` shell, live `request()` helper (mocks untouched). All `bg-emerald-*` one-offs routed through tokens; `StatusLookupForm` refactored onto patterns. Verified: `npm run build` exit 0, `npm run lint` exit 0 (1 pre-existing warning). Limitation: no browser tooling here — 360px/keyboard checks by class audit only (unprefixed mobile baseline, `sm:` enhancements, skip link, focus rings, `role=alert`/`aria-live`); real-device pass deferred to TASK-011/012.

## In progress
- None

## Blocked / decisions needed
- TASK-001 remaining: Q-06 correction policy, Q-07 privacy approval, Q-08 notifications, Q-09 hosting, Q-10 RTO/RPO — owner: health center (+ legal review for Q-07). Q-05 matrix complete 2026-10-16 (all-roles: patients/consultations/reports; admin+: requests-approve/services/announcements/users).
- RULES.md §4 / DEVELOPMENT_PLAN.md §3 diagrams still show `database/` under `backend/` — diagram fix needs approval (deferred, recorded in DECISIONS.md).

## Known issues
- `npm run lint` emits 1 non-blocking warning (`button.jsx:62` fast-refresh).
- Staff approval flow has no reschedule (date/time change) — no approved rule yet.
- `PDO::exec()` on result-producing statements crashes this PHP/mysqlnd build silently (exit 255) — test harness uses `query()` + `closeCursor()` (see `docs/TESTING.md`).

## Next recommended task
- TASK-014 staff authorization policies (role gating; permission matrix still needs Q-05 answers) → TASK-015 appointment administration.

---
## Related notes
- Role: state — current truth + next task (mirrors [[TASKS]]).
- Governed by: [[RULES]] · [[docs/DECISIONS|DECISIONS]] · [[DEVELOPMENT_PLAN]]
- Queue: [[TASKS]] · History: [[tasks/plan|plan]]
- Specs: [[docs/ARCHITECTURE|ARCHITECTURE]] · [[docs/API|API]] · [[docs/DATABASE|DATABASE]] · Verified by: [[docs/TESTING|TESTING]] · Deploys via: [[docs/DEPLOYMENT|DEPLOYMENT]]
