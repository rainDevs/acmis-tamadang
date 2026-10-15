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
- TASK-001: Confirm clinic rules, service list, hours, capacity, privacy requirements — BLOCKED on health-center input, do not invent
- TASK-007: Database connection + API error conventions (depends TASK-005)
- TASK-008: Services/availability data model (depends TASK-001, TASK-005)
- TASK-009: Public availability endpoint (depends TASK-007, TASK-008)
- TASK-010: Public appointment creation endpoint (depends TASK-009)
- TASK-011: Mobile-first public booking UI (depends TASK-002, TASK-009)
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
