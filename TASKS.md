# ACMIS Task Backlog

Single source of truth for actionable work. Status flow: `Backlog → Ready → In Progress → In Review → Done`. Use `Blocked` when a required decision or dependency is missing. Do not mark `Done` until `RULES.md §19` / `DEVELOPMENT_PLAN.md §10.9` Definition of Done is met.

ID convention: bootstrap control-file tasks use `TASK-901…908` to avoid colliding with the product backlog `TASK-001…015` suggested in `DEVELOPMENT_PLAN.md §15`. Product tasks will be detailed in a follow-up planning pass and are listed as Unscheduled below.

Precedence: `RULES.md` > `docs/DECISIONS.md` > `DEVELOPMENT_PLAN.md` > this file > existing code. Record consequential decisions in `docs/DECISIONS.md`, not here.

---

## TASK-901: Initialize TASKS.md backlog for control files
- Status: Done
- Phase: Phase 0 — Requirements and project setup
- Goal: Establish this backlog with bootstrap tasks TASK-901…908 in the mandatory format so agents have one authoritative task list.
- Dependencies: None
- Scope: Create `TASKS.md` with header, ID convention note, 7 bootstrap task definitions (902…908), and Unscheduled product-task reference.
- Out of scope: Creating PROGRESS.md or any `docs/*.md`; implementing product features; editing RULES.md or DEVELOPMENT_PLAN.md.
- Expected files/modules:
- `TASKS.md`
- Acceptance criteria:
- [ ] `TASKS.md` exists at repo root with tasks 901…908 in the mandatory 11-field format
- [ ] ID-convention note explains 900-series vs product 001…015
- [ ] No product implementation details fabricated
- Verification commands/tests:
- [ ] File-exists check for `TASKS.md`; visual review of format compliance
- Security/privacy considerations:
- [ ] No secrets or patient data in backlog; synthetic references only
- Notes/decisions:
- [ ] Created by plan `tasks/plan.md`; product TASK-001…015 expansion deferred to follow-up pass

## TASK-902: Create PROGRESS.md baseline
- Status: Done
- Phase: Phase 0 — Requirements and project setup
- Goal: Record current project state (frontend mock-only, empty backend skeleton, empty database/) and next task so sessions resume correctly.
- Dependencies: TASK-901
- Scope: Create `PROGRESS.md` in the `RULES.md §17` / `DEVELOPMENT_PLAN.md §10.6` format: current phase/task/status, Completed, In progress, Blocked/decisions needed, Known issues, Next recommended task.
- Out of scope: Creating other docs; changing code; resolving clinic-policy questions (list them as Blocked instead).
- Expected files/modules:
- `PROGRESS.md`
- Acceptance criteria:
- [ ] `PROGRESS.md` states Phase 0, current task TASK-903, overall status (frontend mock-only, no backend endpoints, no migrations)
- [ ] Blocked section lists unresolved policies from DEVELOPMENT_PLAN §16 without inventing answers
- [ ] Next recommended task is TASK-903 with reason
- Verification commands/tests:
- [ ] File-exists check; cross-check claims against actual `frontend/src/services/api.js`, empty `backend/`, empty `database/` listings
- Security/privacy considerations:
- [ ] No real patient data, secrets, or credentials in progress notes
- Notes/decisions:
- [ ] Source of truth for state: filesystem inspection 2026-10-15 (backend/ empty skeleton, database/ has only empty migrations|seeders)

## TASK-903: Create docs/DECISIONS.md baseline
- Status: Done
- Phase: Phase 0 — Requirements and project setup
- Goal: Establish the decision log and record the already-executed 3-tier move (`backend/database/` → `database/`) plus frontend mock-only status.
- Dependencies: TASK-901
- Scope: Create `docs/DECISIONS.md` with entry format (date, decision, rationale, owner/approver, affected tasks) and seed entries: 3-tier root layout (backend, database, docs, frontend); contradiction note that RULES.md §4 / DEVELOPMENT_PLAN.md §3 diagrams still show database/ under backend/ (deferred edit); frontend mock API is temporary; stack locked per RULES.md §3.
- Out of scope: Editing RULES.md or DEVELOPMENT_PLAN.md diagrams in this pass; adding product or clinical decisions not yet approved.
- Expected files/modules:
- `docs/DECISIONS.md`
- Acceptance criteria:
- [ ] File exists with dated entries for root-level `database/` move, mock-only frontend, and stack lock
- [ ] Each entry has decision, rationale, owner/approver (owner TBD where unconfirmed), affected tasks
- [ ] Explicitly notes diagram contradiction and defers diagram fix to a later approved task
- Verification commands/tests:
- [ ] File-exists check; verify `database/` at root and absent under `backend/` via directory listing
- Security/privacy considerations:
- [ ] No invented clinic policy, roles, or legal conclusions
- Notes/decisions:
- [ ] This is the ground-truth file TASK-904…908 depend on

## TASK-904: Create docs/ARCHITECTURE.md baseline
- Status: Done
- Phase: Phase 0 — Requirements and project setup
- Goal: Document actual module boundaries and data flow (`Browser → React → PHP API (planned) → MySQL (planned)`) distinguishing Implemented from Planned.
- Dependencies: TASK-903
- Scope: Create `docs/ARCHITECTURE.md`: current frontend modules (routes, pages, features, layouts, services per `frontend/src/` listing), empty backend skeleton (`src/Config|Database|Middleware|Modules|Routes|Shared`, `public/`, `storage/logs/`, `tests/`), root `database/` tier, and data-flow diagram. Cite `docs/DECISIONS.md` for root-level database/.
- Out of scope: Designing new modules; moving files; documenting unapproved stack changes.
- Expected files/modules:
- `docs/ARCHITECTURE.md`
- Acceptance criteria:
- [ ] File describes only what exists (frontend file list accurate; backend/databaseOptimization explicitly empty of code)
- [ ] Implemented vs Planned labels on every boundary; data flow matches DEVELOPMENT_PLAN §3 rules (no direct frontend→MySQL)
- [ ] References `docs/DECISIONS.md` for 3-tier layout
- Verification commands/tests:
- [ ] File-exists check; spot-check 3–4 listed paths exist; confirm `docs/brand-guidelines.md` unmodified
- Security/privacy considerations:
- [ ] Documents that frontend is not a security boundary; no secrets in diagram
- Notes/decisions:
- [ ] Keep minimal — do not scaffold every possible folder in advance per RULES.md §4

## TASK-905: Create docs/API.md baseline
- Status: Done
- Phase: Phase 0 — Requirements and project setup
- Goal: Record that no real API is implemented yet and capture the Planned contract shape from the frontend mock so the PHP backend can replace it later.
- Dependencies: TASK-903
- Scope: Create `docs/API.md`: status banner (no endpoints implemented as of 2026-10-15), Planned endpoint families from DEVELOPMENT_PLAN §9, mock function mapping from `frontend/src/services/api.js` (`getServices`, `getAvailabilitySummary`, `lookupAppointment`, `submitAppointment`), `{ success, message, data }` envelope, and privacy rule (public lookup returns status + schedule only).
- Out of scope: Implementing any PHP endpoint; inventing endpoint names or schemas beyond DEVELOPMENT_PLAN §9 + mock files.
- Expected files/modules:
- `docs/API.md`
- Acceptance criteria:
- [ ] File states zero implemented endpoints and lists Planned families with empty-contract tables marked Planned
- [ ] Mock-to-Planned mapping cites exact mock file paths and the 404/422 behaviors in `api.js`
- [ ] Update policy noted (update on every contract change per RULES.md §6)
- Verification commands/tests:
- [ ] File-exists check; verify cited mock functions exist in `frontend/src/services/api.js`
- Security/privacy considerations:
- [ ] Documents 401 vs 403 vs 404 handling intent and no-leak error rule; no patient data in examples (synthetic `ACMIS-2026-…` only)
- Notes/decisions:
- [ ] Source: DEVELOPMENT_PLAN §9 + `api.js` + `mockData.js`; nothing else

## TASK-906: Create docs/DATABASE.md baseline
- Status: Done
- Phase: Phase 0 — Requirements and project setup
- Goal: Document planned entities and the migration workflow while stating truthfully that zero migrations exist.
- Dependencies: TASK-903, TASK-904
- Scope: Create `docs/DATABASE.md`: status banner (no migrations committed; `database/migrations/` and `database/seeders/` empty), planned entity list from DEVELOPMENT_PLAN §7 (staff_users, roles, patients, appointment_services, clinic_schedules/slots, appointments, appointment_status_history, consultations, audit_logs, system_settings) marked Planned, migration/seed workflow, timestamp/timezone policy as TBD, fresh-DB-from-empty procedure as TBD pending TASK-005.
- Out of scope: Writing any SQL migration or seed; inventing columns, types, or constraints.
- Expected files/modules:
- `docs/DATABASE.md`
- Acceptance criteria:
- [ ] File states zero migrations/seeds exist and every table is labeled Planned with no column-level claims
- [ ] References root-level `database/` path (not `backend/database/`) with link to `docs/DECISIONS.md`
- [ ] Includes update-on-schema-change rule per RULES.md §7
- Verification commands/tests:
- [ ] File-exists check; confirm `database/migrations/` and `database/seeders/` contain no files
- Security/privacy considerations:
- [ ] Synthetic data only; no real patient records as seeds; destructive-change approval rule stated
- Notes/decisions:
- [ ] Detailed schema design deferred to TASK-008 (product backlog) after TASK-001 business rules confirmed

## TASK-907: Create docs/TESTING.md baseline
- Status: Done
- Phase: Phase 0 — Requirements and project setup
- Goal: Record the exact verification commands that exist today so agents never claim unrun tests.
- Dependencies: TASK-904, TASK-905, TASK-906
- Scope: Create `docs/TESTING.md`: repo-present commands only (`frontend`: `npm run build`, `npm run lint` per `package.json`; backend PHP syntax checks when PHP files appear; DB disposable-database procedure as Planned), mobile-first checks, evidence-reporting rule (exact command + outcome, no fake passes).
- Out of scope: Adding a test framework; writing tests; documenting commands not present in the repo.
- Expected files/modules:
- `docs/TESTING.md`
- Acceptance criteria:
- [ ] Every documented command was verified to exist (`package.json` scripts read; PHP/DB commands labeled by availability)
- [ ] No framework introduced; unrun/unavailable checks labeled Outstanding with exact next step
- [ ] Evidence rule from RULES.md §14 restated (never claim pass without run + observed result)
- Verification commands/tests:
- [ ] File-exists check; run `npm run build` from `frontend/` and record outcome in the task report (build result informs doc accuracy, doc itself stays command-focused)
- Security/privacy considerations:
- [ ] No credentials or patient data in test examples; disposable/test DB rule stated
- Notes/decisions:
- [ ] Expand per-feature tests when vertical slices land (TASK-012 etc.)

## TASK-908: Create docs/DEPLOYMENT.md baseline
- Status: Done
- Phase: Phase 0 — Requirements and project setup
- Goal: Document environment setup and the no-production-deployment-yet truth with backup/recovery as Planned.
- Dependencies: TASK-904, TASK-906, TASK-907
- Scope: Create `docs/DEPLOYMENT.md`: local dev (XAMPP/Apache + MySQL), separate dev/test/prod config, HTTPS + least-privilege prod DB rules, status banner (no prod hosting selected, no deployment performed), backup/restore/rollback as Planned checklists referencing DEVELOPMENT_PLAN §11 Phase 9 exit criteria.
- Out of scope: Selecting prod hosting; deploying; changing any live infrastructure or production config.
- Expected files/modules:
- `docs/DEPLOYMENT.md`
- Acceptance criteria:
- [ ] File states no production deployment exists and lists only approved hosting constraints (PHP + MySQL + HTTPS, internet-accessible for public booking)
- [ ] Secrets-outside-version-control + `.gitignore`/example-env procedure included (or marked TBD if no example env exists yet, without creating secrets)
- [ ] Backup/restore/rollback sections present and labeled Planned until rehearsed
- Verification commands/tests:
- [ ] File-exists check; verify no prod credentials or URLs invented
- Security/privacy considerations:
- [ ] No passwords, keys, session secrets, or real data; explicit approval required before any live change per RULES.md §12/§18
- Notes/decisions:
- [ ] Hosting, RTO/RPO, and contacts remain open questions per DEVELOPMENT_PLAN §16

---

## Checkpoint: Ground truth (after TASK-901…903)
- [x] `TASKS.md`, `PROGRESS.md`, `docs/DECISIONS.md` exist and agree on root layout
- [x] 3-tier contradiction with RULES/PLAN diagrams explicitly noted, not silently fixed
- [x] Human review before parallel docs pass

## Checkpoint: State docs (after TASK-904…906)
- [x] ARCHITECTURE/API/DATABASE accurately describe current filesystem; Implemented vs Planned labels present
- [x] `docs/brand-guidelines.md` unmodified; no invented endpoints, tables, or policies
- [x] Frontend production build still passes (`npm run build` from `frontend/`)

## Checkpoint: Complete (after TASK-907…908)
- [x] All 8 required files exist: `TASKS.md`, `PROGRESS.md`, `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/DATABASE.md`, `docs/DECISIONS.md`, `docs/TESTING.md`, `docs/DEPLOYMENT.md` (`RULES.md` + `DEVELOPMENT_PLAN.md` pre-existed)
- [x] Each doc cross-links its parent RULES.md / DEVELOPMENT_PLAN.md section
- [x] `TASKS.md` + `PROGRESS.md` reflect actual state; ready for product backlog detailing

---

## Unscheduled — product backlog (from DEVELOPMENT_PLAN.md §15)

Detailed for Phase 0 below (TASK-002…006). TASK-007…015 remain one-liners until their planning pass.

## TASK-002: Initialize React/Vite frontend and verify build
- Status: Done
- Phase: Phase 0 — Requirements and project setup
- Goal: Confirm the pre-existing React/Vite frontend builds and lints cleanly; no new UI work.
- Dependencies: None
- Scope: Run `npm run build` + `npm run lint` from `frontend/`; record outcomes. Fix nothing unless the build is red (report only).
- Out of scope: Any UI/API change; adding dependencies.
- Expected files/modules:
- `frontend/` (no changes expected)
- Acceptance criteria:
- [ ] `npm run build` exits 0 and emits `dist/`
- [ ] `npm run lint` outcome recorded (warnings disclosed, no hidden failures)
- Verification commands/tests:
- [ ] `npm run build` + `npm run lint` from `frontend/`, exact exit codes recorded
- Security/privacy considerations:
- [ ] No secrets introduced; no patient data in fixtures (synthetic `mockData.js` only)
- Notes/decisions:
- [ ] Frontend pre-existed this task; build passed 2026-10-15 (2539 modules) during TASK-907

## TASK-003: Initialize PHP API and health endpoint
- Status: Done
- Phase: Phase 0 — Requirements and project setup
- Goal: Minimal dependency-free PHP API skeleton with a `GET /api/health` endpoint returning the standard `{ success, message, data }` envelope.
- Dependencies: None
- Scope: `backend/composer.json` (autoload only, no deps), `backend/public/index.php` front controller, `backend/src/Shared/Response.php` envelope helper, `backend/src/Routes/api.php` route map, `backend/src/Modules/Health/HealthController.php`, `backend/tests/health_check.php` CLI test.
- Out of scope: Database access, auth, any endpoint beyond `/api/health` + 404 handling; inventing clinic policy.
- Expected files/modules:
- `backend/composer.json`
- `backend/public/index.php`
- `backend/src/Shared/Response.php`
- `backend/src/Routes/api.php`
- `backend/src/Modules/Health/HealthController.php`
- `backend/tests/health_check.php`
- Acceptance criteria:
- [ ] `GET /api/health` returns HTTP 200 + `{ success: true, message, data: { status: ok, time } }`
- [ ] Unknown routes return JSON 404 with safe message (no paths/SQL/stack)
- [ ] `php -l` passes on all new PHP files; CLI test exits 0
- Verification commands/tests:
- [ ] `php -l` per file; `php backend/tests/health_check.php`; `composer validate`; live `php -S` + curl check for `/api/health` and 404
- Security/privacy considerations:
- [ ] No DB, no auth bypass possible; error responses leak nothing; no secrets in code
- Notes/decisions:
- [ ] Dependency-free (no vendor install needed); PDO/auth deferred to TASK-007/013

## TASK-004: Add environment configuration and ignore secrets
- Status: Done
- Phase: Phase 0 — Requirements and project setup
- Goal: Placeholder-only example envs + root `.gitignore` so secrets never enter version control.
- Dependencies: TASK-002, TASK-003
- Scope: Root `.gitignore`, `backend/.env.example`, `frontend/.env.example`. No real `.env` files committed.
- Out of scope: Production values; any live config change.
- Expected files/modules:
- `.gitignore`
- `backend/.env.example`
- `frontend/.env.example`
- Acceptance criteria:
- [ ] Examples contain placeholders only (empty password/secret fields)
- [ ] `.gitignore` covers `backend/vendor/`, `backend/.env`, `frontend/dist/`, logs, data dumps — but NOT `database/migrations/*.sql`
- [ ] No real `.env` file exists in repo
- Verification commands/tests:
- [ ] File-exists + content review; `git status`-equivalent listing shows no `.env` tracked (gitless repo: manual file check)
- Security/privacy considerations:
- [ ] Empty credential fields; secrets-outside-VC rule documented
- Notes/decisions:
- [ ] None yet

## TASK-005: Establish MySQL migration workflow
- Status: Done
- Phase: Phase 0 — Requirements and project setup
- Goal: Documented naming/apply/verify workflow for `database/migrations/` + `database/seeders/` with zero real schema (schema deferred to TASK-008).
- Dependencies: TASK-003
- Scope: `database/README.md` (naming `YYYYMMDDHHMMSS_description.sql`, apply order, fresh-DB + disposable-DB procedure), `database/migrations/00000000000000_template.sql` (comment-only, harmless to apply), `database/seeders/README.md` (synthetic-only rule).
- Out of scope: Any real table/column definition; live DB apply (no MySQL in this environment — stays Outstanding).
- Expected files/modules:
- `database/README.md`
- `database/migrations/00000000000000_template.sql`
- `database/seeders/README.md`
- Acceptance criteria:
- [ ] Workflow doc covers naming, apply order, fresh-DB-from-empty + disposable-DB verification steps
- [ ] Template file is comment-only/harmless; no schema claims anywhere
- [ ] `docs/DATABASE.md` updated to reference the workflow
- Verification commands/tests:
- [ ] File-exists checks; template content review; live-apply on disposable DB recorded as Outstanding (no MySQL here)
- Security/privacy considerations:
- [ ] Synthetic seeds only; destructive-change approval rule stated
- Notes/decisions:
- [ ] Detailed schema deferred to TASK-008 after TASK-001 business rules confirmed

## TASK-006: Document architecture, API conventions, test commands
- Status: Done
- Phase: Phase 0 — Requirements and project setup
- Goal: Update baseline docs to reflect the Phase 0 bundle (health endpoint implemented, env + migration workflow established).
- Dependencies: TASK-002, TASK-003
- Scope: Update `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/DATABASE.md`, `docs/TESTING.md`, `docs/DEPLOYMENT.md`, `docs/DECISIONS.md` entries.
- Out of scope: Product feature docs; inventing contracts beyond `/api/health`.
- Expected files/modules:
- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/DATABASE.md`
- `docs/TESTING.md`
- `docs/DEPLOYMENT.md`
- `docs/DECISIONS.md`
- Acceptance criteria:
- [ ] `/api/health` documented as the single Implemented endpoint; everything else still Planned
- [ ] New PHP + env + migration commands recorded with exact working directories
- [ ] No fabricated contracts
- Verification commands/tests:
- [ ] File-exists + cross-check against implemented files
- Security/privacy considerations:
- [ ] No secrets or patient data in docs
- Notes/decisions:
- [ ] Baseline from TASK-901…908 updated in place

## Still unscheduled (one-liners, later pass)

## TASK-001: Confirm clinic rules, service list, hours, capacity, privacy requirements
- Status: Blocked
- Phase: Phase 0 — Requirements and project setup
- Goal: Get written health-center answers to every operational question in DEVELOPMENT_PLAN.md §16 so schema, endpoints, and workflows (TASK-008…015) encode approved policy instead of invented policy.
- Dependencies: None (blocks TASK-008, TASK-009, TASK-010, TASK-011, TASK-013, TASK-014, and indirectly TASK-012, TASK-015)
- Scope: Send the questionnaire below to the health center; record verbatim answers in `docs/DECISIONS.md` (one dated entry per answer, with owner/approver); unblock dependent tasks only for answered items.
- Out of scope: Writing migrations, endpoints, or UI; inventing any policy, role, field, or legal conclusion; interpreting ambiguous answers without follow-up.
- Expected files/modules:
- `docs/DECISIONS.md` (answers recorded as approved decisions)
- `TASKS.md` (this task → Done only when all gating answers are recorded; partial answers unblock item-by-item with explicit note)
- `PROGRESS.md` (Blocked section tracks unanswered items)
- Acceptance criteria:
- [ ] Every Q-01…Q-10 below has either a recorded health-center answer (in DECISIONS.md with date + approver) or an explicit deferral with scope impact noted
- [ ] No schema, endpoint, or workflow encodes an unanswered item
- [ ] TASK-008…015 dependencies updated to reflect which answers gate which build step
- Verification commands/tests:
- [ ] File-exists + content review of DECISIONS.md entries (no test commands; this task is evidence-gathering, and claiming it Done without written answers is prohibited per RULES.md §18)
- Security/privacy considerations:
- [ ] Questionnaire and answers must contain no real patient data — service names and role titles only; sample records, if any, strictly synthetic
- Notes/decisions:
- [ ] Round 1 answers recorded in `docs/DECISIONS.md` 2026-10-16: Q-01 [x] 6 services; Q-02 [x] Mon–Fri 8:00am–5:00pm, 30-min, 1/slot, 18 slots/day (follow-up confirmed); Q-03 [x] always staff-approved; Q-04 [x] check-at-visit procedure, no system dedup; Q-05 [~] role names only, permission matrix deferred; Q-06 [~] field structure transcribed (labels only), correction policy OPEN; Q-07 [~] privacy draft PROPOSED, approval pending; Q-08/09/10 [ ] unknown
- [ ] Privacy source-photo warning: owner-provided form photo contains real patient identifiers — never commit; delete from Temp after use
- Open questions (from DEVELOPMENT_PLAN.md §16; do NOT invent answers):
- [ ] Q-01 Services: Which appointment services are offered? (exact names for `appointment_services`)
- [ ] Q-02 Schedule: Operating hours per day, holidays/closures, slot duration per service, capacity (patients per slot / per day)?
- [ ] Q-03 Approval: Are requests always pending staff approval before confirmation? Any auto-approved service?
- [ ] Q-04 Duplicates: How are duplicate residents/patients identified and resolved (which identifiers, who merges)?
- [ ] Q-05 Roles: Which staff roles exist, and what may each role read or change (appointments, patients, consultations, reports, admin)?
- [ ] Q-06 Consultations: Required fields in a consultation record? May completed consultations be edited, and do corrections need an audit trail?
- [ ] Q-07 Privacy: Approved privacy notice text, data retention period, authorized disclosure / correction process (per Data Privacy Act of 2012 guidance)?
- [ ] Q-08 Notifications: Will the system send SMS/email? If yes, approved provider, cost bearer, and message content?
- [ ] Q-09 Hosting: Where is production hosted, who maintains it, how are backups protected?
- [ ] Q-10 Recovery: Approved recovery-time and data-loss tolerances (RTO/RPO)?
## TASK-007: Database connection + API error conventions
- Status: Done
- Phase: Phase 1 — Technical foundation
- Goal: PDO MySQL connection factory from env plus standard safe-error helpers and a `GET /api/health/db` probe. No schema, no auth, no business logic.
- Dependencies: TASK-005
- Scope: `backend/src/Config/config.php` (env + dbConfig), `backend/src/Database/Connection.php` (PDO factory + ping), `backend/src/Shared/ApiError.php` (401/403/404/422/500/503 safe envelopes + server-side log without secrets), `backend/src/Modules/Health/DbHealthController.php` (`GET /api/health/db`), route entry in `backend/src/Routes/api.php`, front-controller wiring in `backend/public/index.php`, CLI test `backend/tests/db_connection_check.php`.
- Out of scope: Any table/column/migration; auth/session logic (TASK-013); inventing clinic policy; changing `GET /api/health` behavior.
- Expected files/modules:
- `backend/src/Config/config.php`
- `backend/src/Database/Connection.php`
- `backend/src/Shared/ApiError.php`
- `backend/src/Modules/Health/DbHealthController.php`
- `backend/src/Routes/api.php`
- `backend/public/index.php`
- `backend/tests/db_connection_check.php`
- Acceptance criteria:
- [ ] PDO factory uses env `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASS` (+ `DB_CHARSET`, default `utf8mb4`), `ERRMODE_EXCEPTION`, `FETCH_ASSOC`, `EMULATE_PREPARES=false`; prepared statements only
- [ ] Error helpers return `{ success: false, message, data }` with correct codes (401/403/404/422/500/503) and safe messages (no SQL/stack/paths/secrets/DSN)
- [ ] `GET /api/health/db` returns 200 when `SELECT 1` succeeds, 503 `Database unavailable.` when it does not — never leaking internals
- [ ] `php -l` clean on all new/changed PHP files; CLI tests exit 0; live `php -S` checks pass for `/api/health`, `/api/health/db`, unknown route
- Verification commands/tests:
- [ ] `php -l` per file; `php backend/tests/health_check.php`; `php backend/tests/db_connection_check.php`; `composer validate`; live `php -S localhost:8000 -t backend/public` + checks for 200/503/404 bodies
- Security/privacy considerations:
- [ ] No credentials in code/logs/responses; server log records class+code only (message scrubbed of password); no patient data anywhere
- Notes/decisions:
- [ ] MySQL server absent here — live DB-success path verified via injected PDO (sqlite memory) in CLI test; live HTTP `/api/health/db` expected 503 safely until MySQL is provisioned
## TASK-008: Services/availability data model
- Status: Done
- Phase: Phase 2 — Public appointment request vertical slice
- Goal: Version-controlled MySQL schema for the approved service catalog, weekly schedule template, holiday closures, and appointment requests — no endpoints, no UI, no auth columns.
- Dependencies: TASK-001 (partial: Q-01 services, Q-02 schedule, Q-03 always-approved answered 2026-10-16), TASK-005 (workflow)
- Scope: 4 migrations (`appointment_services`, `clinic_schedules`, `schedule_closures`, `appointments`) + 2 seeders (6 approved services, Mon–Fri 08:00–17:00 template). Time-zone policy documented (slots = Asia/Manila wall-clock DATE/TIME; audit = TIMESTAMP UTC). Capacity rule encoded as 1/slot; overbooking prevention via transactional locking in TASK-010 (no UNIQUE on slot — cancelled/completed rows must coexist), UNIQUE on `reference_no` only.
- Out of scope: Endpoints (TASK-009/010), UI (TASK-011), staff/actor columns (TASK-013), status-history table (TASK-015), consultation tables (later, Q-06 open), permission matrix (TASK-014), any invented policy.
- Expected files/modules:
- `database/migrations/20261016000001_create_appointment_services.sql`
- `database/migrations/20261016000002_create_clinic_schedules.sql`
- `database/migrations/20261016000003_create_schedule_closures.sql`
- `database/migrations/20261016000004_create_appointments.sql`
- `database/seeders/20261016000001_appointment_services.sql`
- `database/seeders/20261016000002_clinic_schedules_weekday.sql`
- Acceptance criteria:
- [ ] Tables/keys match DECISIONS.md 2026-10-16 answers only (6 service names, Mon–Fri 8–17, 30-min, 1/slot, pending-default, canonical ENUM from RULES §10)
- [ ] InnoDB + utf8mb4_unicode_ci; PKs, FK (service) with named constraints, CHECKs on day/window/duration/capacity
- [ ] Each file has rollback header; no destructive content; no patient data in seeds (reference data only)
- [ ] Fresh-DB apply on disposable MySQL verified 2026-10-16 (see Notes)
- Verification commands/tests:
- [ ] File review vs DECISIONS.md answers; `"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u <devuser> -p acmis_test < migration` per file in order + seeders; duplicate-key + FK-violation + CHECK-violation negative tests; `SHOW CREATE TABLE` spot-check
- Security/privacy considerations:
- [ ] Seeds contain approved reference data only (service names, weekday hours) — no patient, contact, or credential data; dev credentials never committed or logged
- Notes/decisions:
- [ ] MySQL80 service Running but `root` nopassword denied 2026-10-16; live-apply needs disposable-DB credentials from owner
- [ ] 2026-10-16: owner chose self-run verification — then authorized agent-run with local dev credential (transient env only, never written to files; cleared afterwards). Full verification passed (see outcomes above). Disposable `acmis_test` dropped after run; no residue.
## TASK-009: Public availability endpoint
- Status: Done
- Phase: Phase 2 — Public appointment request vertical slice
- Goal: Public `GET /api/public/availability` returning per-day slot detail (template − closures − pending/approved bookings) with `slots_left`/`is_available`. No auth, no patient data in responses.
- Dependencies: TASK-007, TASK-008 (both Done)
- Scope: `backend/src/Modules/Availability/AvailabilityService.php` (slot computation), `.../AvailabilityController.php` (param validation + envelope), route entry, front-controller wiring, CLI test `backend/tests/availability_check.php` (disposable-DB backed).
- Out of scope: Appointment creation (TASK-010), UI wiring (TASK-011), auth, any schema change.
- Expected files/modules:
- `backend/src/Modules/Availability/AvailabilityService.php`
- `backend/src/Modules/Availability/AvailabilityController.php`
- `backend/src/Routes/api.php`
- `backend/public/index.php`
- `backend/tests/availability_check.php`
- Acceptance criteria:
- [ ] `GET /api/public/availability?service_id=&from=&to=` returns 200 + day objects `{ date, service_id, service_name, closed, slots[{ start_time, capacity, booked, slots_left, is_available }], slots_left, capacity }`; day totals match mock keys (`date`, `service_id`, `slots_left`, `capacity`)
- [ ] pending + approved bookings occupy capacity; rejected/cancelled/completed/no_show free it; closures → `closed:true`, weekends → empty slots; past slots `is_available:false`
- [ ] Invalid service/date/range → 422 safe messages; DB down → 503; no requester/contact data anywhere in responses
- [ ] `php -l` clean; CLI test exits 0 on disposable DB; live `php -S` 200 + 422 checks pass; disposable DB dropped after
- Verification commands/tests:
- [ ] `php -l` per file; `php backend/tests/availability_check.php` (with transient dev-DB env); live `php -S` + checks for 200/422/404 bodies
- Security/privacy considerations:
- [ ] Public endpoint returns counts only — no names, contacts, or medical data; bounded window (default 14d, max 31d); dev credentials transient env only, never in files
- Notes/decisions:
- [ ] Availability counts pending+approved as occupying (capacity 1/slot); documented in `docs/API.md`
## TASK-010: Public appointment creation endpoint
- Status: Done
- Phase: Phase 2 — Public appointment request vertical slice
- Goal: Public `POST /api/public/appointments` creating a `pending` request with generated reference, under a transactional capacity lock. No auth, no lookup, no status changes.
- Dependencies: TASK-009 (Done)
- Scope: `backend/src/Modules/Appointments/AppointmentService.php` (transaction + `SELECT … FOR UPDATE` capacity check + insert), `.../AppointmentController.php` (JSON body parsing + server-side validation), `SlotTakenException`, route entry, wiring, CLI test `backend/tests/appointment_create_check.php` (disposable-DB backed).
- Out of scope: Availability changes, lookup endpoint, status workflow (TASK-015), UI (TASK-011), auth, schema changes.
- Expected files/modules:
- `backend/src/Modules/Appointments/AppointmentService.php`
- `backend/src/Modules/Appointments/AppointmentController.php`
- `backend/src/Modules/Appointments/SlotTakenException.php`
- `backend/src/Routes/api.php`
- `backend/public/index.php`
- `backend/tests/appointment_create_check.php`
- Acceptance criteria:
- [ ] Valid `POST` (name, `09xxxxxxxxx` mobile, active service, future templated non-closed on-grid slot) → 201 `{ reference_no (ACMIS-YYYY-XXXXXX), status: pending, service_id, appointment_date, start_time }`
- [ ] Missing/bad fields, unknown service, past/off-grid/closed/weekend slot → 422 safe messages; taken slot → 409 `Selected schedule is no longer available.`; DB down → 503; malformed JSON → 422
- [ ] Capacity enforced inside transaction (`FOR UPDATE`); second concurrent-shaped booking of same slot rejected; cancelled slot re-bookable
- [ ] `php -l` clean; CLI test exits 0 on disposable DB; live `php -S` 201 + 409 + 422 pass; disposable DB dropped after
- Verification commands/tests:
- [ ] `php -l` per file; `php backend/tests/appointment_create_check.php` (transient dev-DB env); live `php -S` + POST checks for 201/409/422 bodies
- Security/privacy considerations:
- [ ] All client data treated untrusted (RULES §6); prepared statements only; errors leak no SQL; response echoes only requester's own submitted data; dev credentials transient env only
- Notes/decisions:
- [ ] Mobile rule mirrors frontend mock (`09` + 9 digits) — existing convention, no contradicting policy; 409 chosen for taken slot (documented in `docs/API.md`)
## TASK-016: Frontend design foundation (tokens, layouts, patterns)
- Status: Done
- Phase: Phase 1 — Technical foundation (catch-up; originally planned before features)
- Goal: Establish the mobile-first visual foundation every screen builds on: design tokens, public + staff layouts, and reusable form/table/dialog/loading/empty/error patterns compliant with `docs/brand-guidelines.md`.
- Dependencies: None (frontend-only; must precede TASK-011 and TASK-017)
- Scope: Audit existing `frontend/src` (keep working conventions); tokens in `index.css`/theme (Tailwind v4 syntax); `layouts/` (public now, staff shell for TASK-017); shared patterns (`components/shared`, `components/ui` extensions as needed, `lib/` helpers); API-client cutover point (central `services/api.js` ready to swap mock→live per function).
- Out of scope: Booking flow itself (TASK-011), staff screens (TASK-017), any backend change, new dependencies without approval.
- Expected files/modules:
- `frontend/src/index.css`
- `frontend/src/layouts/`
- `frontend/src/components/shared/`
- `frontend/src/components/ui/`
- `frontend/src/lib/`
- Acceptance criteria:
- [ ] Tokens cover color/type/spacing/radius/focus states; dark-mode behavior defined (existing `ThemeToggle` kept working)
- [ ] Mobile-first baseline verified at 360px width (no horizontal overflow) on layout + pattern showcases
- [ ] Form (label/error/disabled/submitting), table→card, dialog, loading, empty, and error patterns each exist once and are reused (no one-offs in later tasks)
- [ ] `npm run build` exit 0; `npm run lint` exit 0 (no new warnings); keyboard + focus-visible checks pass on patterns
- Verification commands/tests:
- [ ] `npm run build` + `npm run lint` from `frontend/`; narrow-viewport (360px) + keyboard walkthrough of touched screens, outcomes recorded
- Security/privacy considerations:
- [ ] No secrets in frontend; patterns include safe-error display guidance (no backend internals rendered)
- Notes/decisions:
- [ ] Foundation for the frontend-first resequence (DECISIONS.md 2026-10-16)

## TASK-011: Mobile-first public booking UI (live endpoints)
- Status: Done
- Phase: Phase 2 — Public appointment request vertical slice
- Goal: Replace the `RequestPage` stub with a working mobile-first flow (service → date → slot → details → review → confirmation with reference) wired to live `GET /api/public/availability` + `POST /api/public/appointments`; confirmation shows reference + pending-notice.
- Dependencies: TASK-002, TASK-009 (Done), TASK-016 (foundation)
- Scope: `features/appointments/` booking components, `pages/public/RequestPage.jsx` rewrite, `services/api.js` live wiring for availability/submit (keep mock fallback only where the endpoint doesn't exist yet — none here), loading/empty/validation/error/success states, 409-taken-slot recovery path.
- Scope amendment 2026-10-16: plus minimal `GET /api/public/services` backend endpoint (planned `DEVELOPMENT_PLAN.md §9` family). Justification: no live service list exists; deriving names from availability leaves the landing page on stale mock data (wrong durations/names vs approved Q-01/Q-02). Endpoint is read-only, no policy invented; tested like the others.
- Out of scope: Status lookup redesign (exists), staff UI (TASK-017), backend changes.
- Expected files/modules:
- `frontend/src/features/appointments/`
- `frontend/src/pages/public/RequestPage.jsx`
- `frontend/src/services/api.js`
- Acceptance criteria:
- [ ] Full flow completable at 360px against live API; real reference returned and displayed; pending-approval notice shown
- [ ] Taken-slot 409 surfaces a safe retry affordance (re-pick slot, no data loss); validation mirrors server rules; network failure states handled
- [ ] `npm run build` + `npm run lint` clean; keyboard walkthrough passes
- Verification commands/tests:
- [ ] Frontend build/lint + live end-to-end booking on disposable DB (create → confirm reference → verify row), recorded per `docs/TESTING.md`
- Security/privacy considerations:
- [ ] No patient data in URLs/titles/logs; minimal fields only; safe error display
- Notes/decisions:
- [x] Mock `service_id` strings vs API ints mapped: landing icons key by approved `name`; booking flow uses int ids throughout (recorded in `docs/API.md`)
- [ ] Post-acceptance polish 2026-10-16: date chips replaced with a month-grid calendar (`ScheduleStep` rewrite + remount-on-fetch via key); slot grid, flow, and contracts unchanged

## TASK-017: Staff screens (login + appointment list/detail, mock-backed)
- Status: Backlog
- Phase: Phase 3 — Staff authentication and permissions (design-ahead)
- Goal: Design staff login + appointment list/detail screens against Planned `DEVELOPMENT_PLAN.md §9` contracts using clearly-labeled temporary mock states, so TASK-013/014/015 APIs are shaped by real UI needs.
- Dependencies: TASK-016 (foundation)
- Scope: `pages/admin/` + `features/staff/` screens, staff layout shell, mock states marked `TEMPORARY-MOCK` in code + UI badge; protected-route structure ready for real auth.
- Out of scope: Real auth/API wiring (TASK-013+), backend changes, permission-matrix invention (still deferred per Q-05).
- Expected files/modules:
- `frontend/src/pages/admin/`
- `frontend/src/features/staff/`
- `frontend/src/layouts/`
- Acceptance criteria:
- [ ] Login, list (filter/pagination structure), and detail screens render all states (loading/empty/error) at 360px; every mock datum labeled temporary + synthetic
- [ ] Documented list of endpoint needs for TASK-013/014/015 (params, shapes, filters) derived from the screens
- [ ] `npm run build` + `npm run lint` clean
- Verification commands/tests:
- [ ] Frontend build/lint + viewport/keyboard walkthrough; mock states never presented as integration proof
- Security/privacy considerations:
- [ ] Synthetic data only; no real credentials in mock login; protected-route scaffolding blocks nothing real yet (documented as non-enforcing until TASK-013)
- Notes/decisions:
- [ ] Design-ahead per frontend-first resequence; wiring lands with TASK-013/014/015
- TASK-012: Verify public booking end to end (depends TASK-010, TASK-011)
- TASK-013: Staff authentication + session security (depends TASK-007)
- TASK-014: Staff authorization policies (depends TASK-013)
- TASK-015: Appointment administration (depends TASK-012, TASK-014)

---
## Related notes
- Role: queue — single source of truth for work (`Backlog → Ready → In Progress → In Review → Done`).
- Governed by: [[RULES]] · [[docs/DECISIONS|DECISIONS]] · [[DEVELOPMENT_PLAN]]
- State mirrors: [[PROGRESS]] · Created by: [[tasks/plan|plan]]
- Specs: [[docs/ARCHITECTURE|ARCHITECTURE]] · [[docs/API|API]] · [[docs/DATABASE|DATABASE]] · Verified by: [[docs/TESTING|TESTING]] · Deploys via: [[docs/DEPLOYMENT|DEPLOYMENT]]
