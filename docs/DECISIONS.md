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

## 2026-10-16 — TASK-007: PDO connection factory + safe error conventions (no schema)
- Decision: `Config::db()` reads `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASS/DB_CHARSET` from env; `Connection::make()` builds PDO MySQL (`ERRMODE_EXCEPTION`, `FETCH_ASSOC`, `EMULATE_PREPARES=false`); `ApiError` fixes safe 401/403/404/422/500/503 envelopes with server-side `log()` (class + code only, password scrubbed, no stack traces); `GET /api/health/db` probes `SELECT 1` → 200 ok or safe 503. No tables, auth, or business logic.
- Rationale: Establishes Phase 1 API→MySQL wiring and consistent error behavior before any schema/auth work, without inventing clinic policy or schema (TASK-001 still blocked).
- Owner/Approver: Project owner (next-move selection 2026-10-16; TASK-001 blocked, TASK-007 dependency-safe)
- Affected tasks: TASK-007 (Done); unblocks TASK-008/009/013
- Outstanding: live 200 against real MySQL on a disposable database (no MySQL here); production hosting/RTO/RPO unchanged.

## 2026-10-16 — TASK-001 answers round 1 (Q-01…Q-06 partial; Q-07 proposed; Q-08/09/10 open)
- Decision (approved by project owner): Service list (Q-01) is fixed at 6 services: `General Consultation`, `Maternal and Child Health Care`, `Immunization and Vaccination`, `Senior Citizen Care`, `Vitals & Screening`, `Health Certificate / Clearance`. New requests always start `pending` and require staff approval; no auto-approved service (Q-03). Duplicate handling (Q-04) is an operational procedure, not a system feature: after approval the patient appears in person; staff check whether the patient is registered — if yes, proceed to consultation with that record; if no, register first, then consult. No automated duplicate merge is required.
- Schedule (Q-02, confirmed incl. follow-up 2026-10-16): Monday–Friday, closed on holidays, 30-minute slots 8:00 am–5:00 pm, 1 patient per slot → 18 slots/day, last slot starts 4:30 pm.
- Roles (Q-05, partial): role names are `Superadmin`, `Admin`, `Staff`. Granular per-permission matrix explicitly deferred ("will be implemented later on") — TASK-014 stays blocked on the matrix; TASK-013 may proceed on role names only.
- Consultation fields (Q-06, partial): structure transcribed 2026-10-16 from the owner-provided paper form photo (field labels only — all patient values in the photo were excluded per RULES.md §9): header (health facility name; patient name, address, birthdate, age, PIN, sex); PhilHealth membership class (Member/Dependent/Sponsored/NHTS/LGU/NGA/Private/IPP/OG/OFW/voluntary/self-employed; NON PHIC; Employed Government/Private; Lifetime); Part I primary preventive services (BP measurement Hypertensive/Nonhypertensive; periodic clinical breast exam; visual inspection with acetic acid) with frequency + quarterly date-performed columns; Part II per-visit (date; history of present illness; physical exam incl. temperature, pulse, respiratory rate, BP, weight, height; assessment/impression; treatment/management plan). Correction/edit policy for completed consultations NOT answered — still open. Privacy warning: the source photo contains a real patient's identifiable data; it must not be committed to the repo and should be deleted from local Temp after use.
- Privacy (Q-07): owner requested a draft notice/retention/disclosure text grounded in Philippine law. Status PROPOSED ONLY — delivered to owner 2026-10-16, NOT approved, NOT in effect; requires health-center head + legal review before posting. Retention period and contact details left as bracketed placeholders (not invented).
- Still open: Q-06 correction policy, Q-07 approval, Q-08 notifications, Q-09 hosting, Q-10 RTO/RPO.
- Owner/Approver: Project owner (answers given 2026-10-16)
- Affected tasks: TASK-001 (still Blocked, partial); unblocks TASK-008 design start (services + slot model) except end-time; TASK-013 role names available.

## 2026-10-16 — Frontend-first resequence (public flow + staff screens before further backend)
- Decision: Pause backend feature work after TASK-010. Next: TASK-016 design foundation → TASK-011 public booking UI (live endpoints) → TASK-017 staff screens (login + appointment list/detail) designed against Planned `DEVELOPMENT_PLAN.md §9` contracts with clearly-labeled temporary mock states. Backend resumes at TASK-013 (auth) informed by the staff-screen needs. Rationale (owner request): four verified endpoints exist with no usable UI (`RequestPage` is a stub, no staff UI); designing screens first validates endpoint shapes before auth/admin APIs get built.
- Owner/Approver: Project owner (frontend-first approved 2026-10-16)
- Affected tasks: TASK-016 (new), TASK-011, TASK-017 (new); TASK-013/014/015 deferred until staff screens land

## 2026-10-16 — TASK-010: public appointment creation (no new schema)
- Decision: `POST /api/public/appointments` validates everything server-side (name non-empty ≤100; mobile `09`+9 digits per frontend-mock rule; active service; future on-grid non-closed slot, Manila clock), then books inside a transaction (`SELECT … FOR UPDATE`, `pending`, `ACMIS-YYYY-XXXXXX` reference). Taken slot → 409 (documented API convention); double-submit surfaces as 409; cancelled slots re-bookable. Same debugging lesson as TASK-009: the CLI suite initially failed 10/27 on a real `HY093` (reused `:time` placeholder under native prepares) — fixed with distinct placeholders and recorded as a backend rule in `docs/TESTING.md`.
- Rationale: Core resident write path; unblocks TASK-011 (booking UI) and TASK-012 (end-to-end verify) without inventing policy.
- Owner/Approver: Project owner (TASK-010 selected 2026-10-16)
- Affected tasks: TASK-010 (Done); unblocks TASK-011/012

## 2026-10-16 — Staff dashboard module map approved
- Decision: Staff area is organized into six modules: Requests (live), Residents/Patients, Consultation, Services, Announcements, Users (all Coming-soon previews, non-navigating until built). Dashboard home at `/admin`; login lands there.
- Rationale: Owner-defined IA; previews carry no fake navigation.
- Owner/Approver: Project owner (requested 2026-10-16)
- Affected tasks: TASK-017 (dashboard added); new backlog TASK-018…022

## 2026-10-16 — TASK-013: staff authentication (roles stored, matrix deferred)
- Decision: `password_hash()`/`password_verify()` + transparent rehash; `staff_users` (approved role names) + `staff_login_attempts` (5 fails → 5-min lock, DB-clock evaluated); fixation-safe native sessions (`ACMISSESSID`, HttpOnly, env-driven Secure/SameSite, 120-min idle); generic 401s (no enumeration); Origin check on auth POSTs; CSRF tokens deferred (same-origin + Lax posture documented). Dev admin `admin` provisioned on `acmistamadangdb` via `create_staff.php` (password reported to owner, rotatable by re-run). Staff UI converted from demo to live session.
- Rationale: Secure staff access must precede admin features (Phase 3); permission enforcement stays in TASK-014.
- Owner/Approver: Project owner (TASK-013 selected 2026-10-16)
- Affected tasks: TASK-013 (Done); unblocks TASK-014/015

## 2026-10-16 — TASK-017: staff screens as TEMPORARY-MOCK design-ahead
- Decision: Staff login/queue/detail built against synthetic in-memory data with on-screen `TEMPORARY-MOCK` badges; demo session grants nothing real and resets on reload; `ProtectedRoute` shape is what TASK-013 will enforce for real. Endpoint needs (login/me, filtered paginated list, detail with history, status PATCH with transition rules + reason) recorded in `docs/API.md`.
- Rationale: Screens must exist before auth/admin APIs so those APIs match real UI needs (frontend-first resequence).
- Owner/Approver: Project owner (TASK-017 selected 2026-10-16)
- Affected tasks: TASK-017 (Done); shapes TASK-013/014/015

## 2026-10-16 — Appointment address field approved (anti-prank verification)
- Decision: Public booking collects `address` (required, ≤255 chars), persisted in `appointments.address`, so staff can verify whether a request is legitimate. No other new fields.
- Rationale: Owner request — name + mobile alone can't distinguish real from prank requests.
- Owner/Approver: Project owner (requested 2026-10-16)
- Affected tasks: TASK-010 (contract extended via migration `20261016000005`), TASK-011 (details step)

## 2026-10-16 — TASK-011 amendment: services endpoint added (no policy invented)
- Decision: Added read-only `GET /api/public/services` beyond TASK-011's original no-backend scope. Deriving the list from availability would have left the landing page on stale mock data (wrong durations/names vs approved Q-01/Q-02). Endpoint is in the planned `DEVELOPMENT_PLAN.md §9` family, tested, documented.
- Owner/Approver: Project owner (scope amendment recorded 2026-10-16)
- Affected tasks: TASK-011 (Done)

## 2026-10-16 — TASK-009: public availability endpoint (no new schema)
- Decision: `GET /api/public/availability` computes template − closures − pending/approved bookings per day, returns counts only (`slots_left`, `is_available`); other statuses free the slot; window default 14d / max 31d; day totals mirror the frontend mock keys (`service_id` int vs mock string — frontend mapping deferred to TASK-011). Live bug found and fixed in the same pass: the route dispatcher passes no args, so `handle()` defaulted to `[]` and ignored the query string — now `null` reads `$_GET` (caught by live HTTP check, not the CLI test).
- Rationale: First public product endpoint; unblocks TASK-010 (creation) and TASK-011 (booking UI) without inventing policy.
- Owner/Approver: Project owner (TASK-009 selected 2026-10-16)
- Affected tasks: TASK-009 (Done); unblocks TASK-010/011

## 2026-10-16 — Local MySQL verified via disposable database
- Decision: Local `MySQL80` service (8.0.43) is the dev-database host; all migration verification runs against disposable databases (e.g. `acmis_test`, dropped after each run). Dev credentials stay outside version control (transient env per run).
- Rationale: Unblocks live migration + constraint verification (TASK-008 fully verified 2026-10-16) without touching any real data.
- Owner/Approver: Project owner (credential authorized 2026-10-16 for local disposable-DB runs)
- Affected tasks: TASK-008 (Done); all future migration tasks

## 2026-10-16 — Superadmin dev account provisioned (hash-only, dev-only)
- Decision: Owner-requested `superadmin` staff account (Super Admin, role `superadmin`, note `App Developer Account`) provisioned on dev DB `acmistamadangdb` via `backend/scripts/create_staff.php` (upsert, `password_hash()` only; secret never committed, never in `database/seeders/`). Script now loads `backend/.env` like the front controller. Credential is dev-only and rotatable by re-run; production passwords must be strong and unique.
- Rationale: App-developer account needed for staff-area work; `staff_users` (not `users`) is the table; plaintext-in-seed is prohibited by `RULES.md` §8/§12.
- Owner/Approver: Project owner (requested 2026-10-16)
- Affected tasks: TASK-013 (provisioning noted); TASK-022 (user admin UI later)

## 2026-10-16 — Request Review permission: approve/reject is admin-only
- Decision: In Request Review, only `superadmin` and `admin` accounts may approve/reject a request; `staff` accounts view only. Encoded server-side in `RequireAuth::APPOINTMENT_REVIEW_ROLES` + `requireRoles()` (403 otherwise); review UI hides the action buttons for staff with a plain-language view-only note. First approved item of the Q-05 permission matrix — the matrix for other modules (patients, consultations, services, announcements, users) stays deferred.
- Rationale: Owner-stated policy; fail-closed on both layers (unknown roles get view-only UI and 403 API).
- Owner/Approver: Project owner (stated 2026-10-16)
- Affected tasks: TASK-014 (partial rule recorded, still Blocked on remaining matrix); TASK-015 (PATCH endpoint must enforce via `requireRoles`); TASK-024 (implementation); TASK-022 (user admin later)

## 2026-10-16 — TASK-020: services master-data admin (edit-only, closures CRUD)
- Decision: Admin+ manages scheduling master data via 7 endpoints: services PATCH (description/duration/active — names stay the approved catalog), schedules PATCH (window/duration/capacity/active — structure fixed), closures GET/POST/DELETE (operational dates). No create/delete for services or schedule rows (no approved rule). Changes apply to future bookings only.
- Rationale: Owner-requested module (matrix: admin+); edit-only bounds keep every approved Q-01/Q-02 value intact while allowing operational tuning.
- Owner/Approver: Project owner (requested 2026-10-16)
- Affected tasks: TASK-020 (Done)

## 2026-10-16 — TASK-026: public lookup via reference + contact suffix
- Decision: `POST /api/public/appointments/lookup` checks the reference plus the last-4 contact digits (timing-safe) and returns status + schedule only; wrong/unknown/malformed inputs share one identical 404. POST keeps both values out of URLs and access logs.
- Rationale: Owner-requested full mock removal; the reference+suffix check was already the approved verification approach (`docs/API.md`).
- Owner/Approver: Project owner (requested 2026-10-16)
- Affected tasks: TASK-026 (Done); TASK-027 (mock deletion next)

## 2026-10-16 — Q-05 permission matrix approved (complete)- Decision: Full per-module matrix (owner-approved 2026-10-16). Requests review: superadmin/admin approve-reject, staff view-only (already in effect). Patients records: all roles (create/search/update). Consultations: all roles (create/view). Services/schedules/closures admin: superadmin/admin only. Announcements publishing: superadmin/admin only. Staff accounts/roles admin: superadmin/admin only. Reports/exports: all roles.
- Rationale: Owner answers to the TASK-001 Q-05 interview; least-privilege split between operational (all roles) and administrative (admin+) functions.
- Owner/Approver: Project owner (answered 2026-10-16)
- Affected tasks: TASK-001 (Q-05 now answered); TASK-014 (unblocked — matrix to enforce); TASK-018/019 (patients/consultations: all roles); TASK-020 (services admin: admin+); TASK-021 (publisher authority decided — admin+); TASK-022 (users admin: admin+)
- Note (owner, 2026-10-16): this matrix is the DEFAULT RBAC matrix. A granular permission management layer (per-user overrides) will be implemented later and takes precedence over these defaults; until then every endpoint enforces the defaults below.
- Enforced 2026-10-16 (TASK-014 Done): central `AccessPolicy` module map + `requireModule()`; PATCH status reuses the `appointments.review` entry; CLI 48/48 + regression suites green.

## 2026-10-16 — TASK-025: announcements board served from MySQL
- Decision: `announcements` table + seeder hold the same 4 board rows (no new copy invented); public `GET /api/public/announcements` serves them pinned-first; board UI reads live. No admin columns or CRUD — publishing workflow stays in blocked TASK-021. Dev DB `acmistamadangdb` migrated + seeded.
- Rationale: Owner-requested full mock removal, announcements first; reference rows must live in the DB to keep the board working.
- Owner/Approver: Project owner (requested 2026-10-16)
- Affected tasks: TASK-025 (Done); TASK-021 (still Blocked); TASK-027 (mock deletion later)

## 2026-10-16 — TASK-023: auth-only gate now, role matrix later
- Decision: Ship `RequireAuth::check()` (authenticated-staff-only, fixed 401) as the single enforcement point for future staff endpoints; per-role distinctions stay deferred with TASK-014 (Q-05 matrix explicitly deferred by owner — no policy invented).
- Rationale: Mechanism without policy: guests are denied today, roles get gated once the approved matrix exists. Deactivation-timing limitation documented in code.
- Owner/Approver: Project owner (scope selected 2026-10-16: auth-only foundation)
- Affected tasks: TASK-023 (Done); TASK-014 (still Blocked on Q-05); TASK-015 (wiring unblocked)

---
## Related notes
- Role: authority log — approved ground truth (`RULES > DECISIONS > PLAN > TASKS`).
- Governed by: [[RULES]] · [[DEVELOPMENT_PLAN]]
- Tracks: [[TASKS]] · [[PROGRESS]]
- Details in: [[docs/ARCHITECTURE|ARCHITECTURE]] · [[docs/API|API]] · [[docs/DATABASE|DATABASE]] · [[docs/TESTING|TESTING]] · [[docs/DEPLOYMENT|DEPLOYMENT]]
- History: [[tasks/plan|plan]]
