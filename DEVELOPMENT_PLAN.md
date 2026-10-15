# ACMIS Development Plan
## Appointment Consultation and Medical Information System
**Project:** Barangay Tamadang Health Center, Kiamba, Sarangani Province  
**Document type:** Implementation roadmap and agentic-development operating guide  
**Status:** Working baseline — update through documented decisions  
**Primary goal:** Build a secure, mobile-first web application for residents to request health-center appointments and for authorized health-center staff to manage appointments, patient records, consultations, and reports.

---

## 1. Project Objectives

ACMIS will provide:

1. A public, mobile-first appointment request portal that residents can use without creating an account.
2. A secure staff portal with authentication and role-based access.
3. Appointment review and management, including availability checks and status tracking.
4. Patient/resident records with controlled access to personal information.
5. Consultation records accessible only to authorized personnel.
6. Reports and administrative tools needed for day-to-day health-center operations.
7. A maintainable codebase that can be developed in small, testable increments with AI coding agents.

### Success criteria

The project is considered ready for pilot use only when:

- Residents can submit valid appointment requests from a mobile phone.
- The system validates inputs and prevents duplicate or conflicting bookings according to the approved scheduling rules.
- Authorized staff can sign in and perform only actions allowed by their roles.
- Appointment and patient data persist correctly in MySQL.
- Medical and personal data are not exposed through public endpoints, logs, or unauthorized staff access.
- Core workflows have automated or repeatable verification steps.
- The application is usable on mobile, tablet, and desktop screens.
- Deployment, backup, recovery, and staff operating procedures are documented.

---

## 2. Technology Stack

Treat this stack as fixed unless a change is explicitly approved and recorded in `DECISIONS.md`.

### Frontend
- React 19
- Vite 8
- JavaScript (not TypeScript unless explicitly approved)
- Tailwind CSS v4
- shadcn/ui components where appropriate
- React Router for client-side routing if needed
- A small, documented HTTP/API client layer for communication with the backend

### Backend
- PHP REST API
- PDO for database access
- JSON request and response format
- Server-side validation and authorization
- Consistent HTTP status codes and error response conventions

### Database
- MySQL
- SQL migration files committed to version control
- Foreign keys, indexes, constraints, and transactions where appropriate

### Development and deployment
- Local development may use XAMPP/Apache and MySQL.
- Production hosting must support PHP and MySQL and must use HTTPS.
- Residents must be able to access the deployed public portal over the internet; a localhost-only deployment is not sufficient for public online booking.
- Keep development, testing, and production configuration separate.
- Never commit passwords, private keys, session secrets, database credentials, or real patient data.

### Stack-change rule
An agent must not replace the stack, add a major framework, introduce a new state-management library, or add a dependency merely for convenience. It must first explain the need, impact, alternatives, and migration implications, then wait for explicit approval and record the decision.

---

## 3. Architecture and Boundaries

Use a simple three-layer architecture:

1. **Frontend:** React UI, routing, client-side validation for usability, responsive layouts, and API calls.
2. **Backend:** PHP REST API, authoritative validation, authentication, authorization, business rules, and data access.
3. **Database:** MySQL tables, constraints, relationships, indexes, and transactions.

### Data flow

`Resident or Staff Browser → React Frontend → PHP REST API → MySQL`

Rules:

- The frontend must never connect directly to MySQL.
- The frontend must not be treated as a security boundary.
- All authorization and business-critical validation must be enforced by the backend.
- Do not duplicate business rules in multiple unrelated places. Client-side checks may improve usability, but the API remains authoritative.
- Keep controllers/endpoints, business logic, and database access separated enough to test and maintain them without introducing unnecessary abstraction.
- Do not expose stack traces, SQL errors, internal paths, secrets, or sensitive records in API responses.

### Proposed repository structure

Adapt to the existing repository if one already exists; do not reorganize it without a clear reason.

```text
acmis/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── appointments/
│   │   │   ├── patients/
│   │   │   ├── consultations/
│   │   │   ├── reports/
│   │   │   └── staff/
│   │   ├── layouts/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── routes/
│   │   └── styles/
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── public/
│   │   └── index.php
│   ├── src/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   ├── Services/
│   │   ├── Repositories/
│   │   ├── Validation/
│   │   └── Support/
│   ├── config/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   ├── routes/
│   ├── tests/
│   └── composer.json
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── DECISIONS.md
│   ├── DEPLOYMENT.md
│   └── TESTING.md
├── RULES.md
├── DEVELOPMENT_PLAN.md
├── TASKS.md
├── PROGRESS.md
├── .gitignore
└── README.md
```

This is a target structure, not a requirement to create every file or directory on day one. Keep the implementation as simple as the project currently needs.

---

## 4. Mandatory Mobile-First Strategy

**ACMIS must be designed and developed mobile-first.** Mobile is the primary design target, not a desktop design that is adapted later.

- Design and implement the smallest supported viewport first, then progressively enhance for tablet and desktop.
- With Tailwind CSS, unprefixed utilities should establish the mobile baseline; responsive prefixes should enhance larger breakpoints.
- Prioritize the public appointment portal for small screens, touch interaction, readable typography, short forms, and low-bandwidth use.
- Staff workflows must remain usable on mobile, including appointment review, patient search, and consultation entry.
- Use responsive tables, card layouts, collapsible navigation, and appropriately sized dialogs where suitable.
- Avoid fixed widths that cause horizontal overflow.
- Minimize unnecessary JavaScript, large images, and network requests.
- Provide loading, empty, success, validation, and error states.
- Test key pages at narrow mobile widths before testing tablet and desktop layouts.
- Do not implement desktop-first and retrofit mobile afterward.
- Mobile usability is part of the acceptance criteria for every UI task.

---

## 5. Functional Scope

### 5.1 Public resident portal
- Public landing page with clear instructions and health-center contact information.
- Appointment request form that does not require a resident account.
- Appointment type/service selection based on approved health-center offerings.
- Available date/time selection based on configured schedules and capacity.
- Resident contact and required identifying information collected only as necessary.
- Review/confirmation screen with a safe reference number or confirmation method.
- Clear explanation that a request is not confirmed until staff approve it, if that is the selected workflow.
- Public status checking only if an approved, privacy-preserving design is implemented. Do not expose records through predictable IDs or broad name/date searches.

### 5.2 Staff authentication and access
- Staff login and logout.
- Secure server-side session handling.
- Role-based authorization enforced on every protected API endpoint.
- Account activation/deactivation and password reset process appropriate to deployment.
- Session expiration and invalidation rules.
- Login and sensitive-action audit events without recording passwords or unnecessary medical details.

### 5.3 Dashboard
- Counts and summaries for relevant appointment statuses.
- Upcoming appointments and operational alerts.
- Date-range filtering where useful.
- Dashboard information must respect staff roles and access permissions.

### 5.4 Appointment management
- View and filter appointment requests.
- Review request details with appropriate access control.
- Approve or reject pending requests, with a reason where appropriate.
- Reschedule or cancel according to approved policy.
- Mark appointments completed or no-show.
- Track status history and timestamps.
- Enforce capacity and scheduling rules on the server, including concurrent requests.
- Prevent unauthorized status transitions.

### 5.5 Resident/patient records
- Create and update patient records for authorized staff.
- Search by minimum necessary identifiers.
- Validate duplicate records and provide a controlled resolution process.
- Limit list results and protect sensitive fields.
- Keep access to personal and medical information role-based and auditable.

### 5.6 Consultation records
- Create and view consultation records for authorized staff.
- Record only fields approved by the health center.
- Validate required fields and relationships.
- Do not make consultation details publicly searchable.
- Restrict edits to authorized roles and define whether corrections require an audit trail.

### 5.7 Reports and administration
- Appointment summaries by date, service, and status.
- Operational reports that expose only information necessary for the user's role.
- Manage approved appointment schedules, services, staff accounts, and roles.
- Audit logs for security-relevant and sensitive record actions.
- Export functions only when authorized, with safeguards for downloaded personal data.

### Explicitly out of scope for the initial MVP unless approved
- Online payments.
- SMS/email gateways requiring external paid services.
- Telemedicine or video consultations.
- Automated medical diagnosis, triage, or treatment recommendations.
- Public access to detailed medical history.
- Native mobile apps.
- Complex integrations with external government or clinical systems.

---

## 6. Appointment Workflow and Business Rules

Use these canonical appointment statuses unless the health center approves a documented change:

- `pending`
- `approved`
- `rejected`
- `cancelled`
- `completed`
- `no_show`

### Required rules
- A new public request begins as `pending`.
- Only authorized staff may approve or reject a pending request.
- Only allowed transitions may be performed; enforce them on the server.
- Record who performed a staff action and when.
- Do not treat a public request as approved until the workflow explicitly approves it.
- Availability and capacity must be checked server-side.
- Use a database transaction and appropriate locking or constraints to prevent overbooking under concurrent requests.
- Prevent accidental duplicate submissions where feasible, for example through idempotency or duplicate-request checks.
- Time zones, clinic operating hours, holidays, service durations, slot capacity, rescheduling policy, and cancellation policy must be confirmed with the health center before they are encoded.
- Never invent clinical or operational policies. If a required policy is unknown, document the question and ask for clarification before implementing it.

---

## 7. Data Model and Database Planning

Create and version-control SQL migrations. Finalize fields and relationships with the health center before production use.

Likely entities:

- `staff_users`
- `roles` and/or `staff_user_roles` if multiple roles per user are needed
- `patients`
- `appointment_services`
- `clinic_schedules` or `appointment_slots`
- `appointments`
- `appointment_status_history`
- `consultations`
- `audit_logs`
- `system_settings`

This list is a planning baseline, not an instruction to create every table before requirements are confirmed.

### Database rules
- Use primary keys and appropriate foreign keys.
- Add unique constraints and indexes based on real business rules and query patterns.
- Store timestamps consistently and document the time-zone policy.
- Use transactions for multi-step writes that must succeed or fail together.
- Use prepared statements for every query containing variable input.
- Never build SQL by concatenating untrusted user input.
- Do not use real patient records as development seeds.
- Use synthetic test data only.
- Avoid destructive schema changes without a migration plan and explicit approval.
- Document how to create a fresh database and apply all migrations from an empty state.
- Backups and restoration must be tested before production deployment.

---

## 8. Security, Privacy, and Safety

ACMIS will handle personal information and may handle sensitive personal information. Apply privacy-by-design and least-privilege principles, and confirm legal and operational requirements with the responsible organization.

- Follow applicable Philippine data-protection requirements, including the Data Privacy Act of 2012, and obtain appropriate institutional guidance.
- Collect only the information needed for the approved workflow.
- Do not include real patient information in source code, prompts, screenshots, logs, test fixtures, or public issue trackers.
- Use PDO prepared statements.
- Validate and normalize inputs on the server.
- Escape untrusted content when rendering HTML.
- Apply authorization checks to every protected endpoint, not only the UI route.
- Use secure password hashing APIs; never store plaintext passwords.
- Protect sessions against fixation and unauthorized reuse; use secure cookie settings appropriate to HTTPS deployment.
- Use CSRF protection where cookie-based authentication and the deployment architecture require it.
- Configure CORS narrowly; do not use permissive wildcard origins with credentials.
- Apply login throttling and reasonable protections against automated abuse.
- Avoid returning patient existence or sensitive details from public lookup endpoints.
- Do not log passwords, tokens, session identifiers, or full medical notes.
- Keep secrets in environment/configuration files outside version control.
- Use HTTPS in production.
- Define retention, access, backup, breach-response, and account-removal procedures before launch.
- Do not make clinical decisions or recommendations through generated logic unless specifically approved, clinically validated, and appropriately governed.

---

## 9. API Conventions

Document endpoints and schemas in `docs/API.md` as they are implemented.

Example endpoint families (final names may be refined consistently):

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/public/services`
- `GET /api/public/availability`
- `POST /api/public/appointments`
- `GET /api/appointments`
- `GET /api/appointments/{id}`
- `PATCH /api/appointments/{id}/status`
- `GET /api/patients`
- `POST /api/patients`
- `GET /api/patients/{id}`
- `PATCH /api/patients/{id}`
- `GET /api/patients/{id}/consultations`
- `POST /api/patients/{id}/consultations`
- `GET /api/reports/appointments`

### API requirements
- Use consistent JSON responses and HTTP status codes.
- Validate method, content type, input shape, lengths, and allowed values.
- Distinguish authentication failures from authorization failures.
- Return safe, actionable error messages without internal implementation details.
- Use pagination and bounded result sets for list endpoints.
- Validate IDs and verify that referenced records exist and are accessible to the current user.
- Do not return fields the caller is not authorized to see.
- Update `docs/API.md` whenever a contract changes.
- Add tests for successful and rejected requests.

---

## 10. Agentic Development Layer

This section governs how AI coding agents should execute the project. It supplements `RULES.md`; it does not override security, privacy, architecture, or stack constraints.

### 10.1 Required project-control files

Maintain these files in the repository:

- `RULES.md` — mandatory coding and security constraints.
- `DEVELOPMENT_PLAN.md` — this roadmap, scope, phases, and milestones.
- `TASKS.md` — task backlog with small implementation units and acceptance criteria.
- `PROGRESS.md` — current project state and next task.
- `docs/ARCHITECTURE.md` — current module boundaries and data flow.
- `docs/API.md` — implemented API contracts.
- `docs/DATABASE.md` — schema, relationships, constraints, and migration instructions.
- `docs/DECISIONS.md` — approved technical and business decisions.
- `docs/TESTING.md` — test strategy and exact verification commands.
- `docs/DEPLOYMENT.md` — environment setup, deployment, backups, and recovery.

Create or update documentation when needed; do not fabricate details for features that do not exist yet.

### 10.2 Document authority and conflict handling

Use this precedence order:

1. Explicit instructions from the project owner in the current task.
2. `RULES.md` for mandatory engineering, security, privacy, and coding constraints.
3. Approved decisions in `docs/DECISIONS.md`.
4. `DEVELOPMENT_PLAN.md` for project scope and sequencing.
5. `TASKS.md` and the specific task's acceptance criteria.
6. Existing code and conventions, when not in conflict with the above.

If two requirements conflict, stop before making a consequential change, describe the conflict, and request clarification. Do not silently choose a solution that changes the approved scope, security model, database structure, or stack.

### 10.3 Mandatory task format

Every implementation task in `TASKS.md` should include:

```md
## TASK-XXX: Short task title
- Status: Backlog | Ready | In Progress | Blocked | In Review | Done
- Phase:
- Goal:
- Dependencies:
- Scope:
- Out of scope:
- Expected files/modules:
- Acceptance criteria:
- Verification commands/tests:
- Security/privacy considerations:
- Notes/decisions:
```

A task is ready only when its goal and acceptance criteria are sufficiently clear. If a task depends on an unconfirmed business rule, mark it `Blocked` and ask the project owner.

### 10.4 Task sizing

- Prefer one focused, independently verifiable change per task.
- A task should normally fit within one agent session and avoid unrelated refactoring.
- Split tasks that require several independent features, broad changes across unrelated modules, or many unverified assumptions.
- Establish shared foundations before building features that depend on them.
- Prefer end-to-end vertical slices over building all UI screens first, all APIs second, and all database behavior last.
- Do not generate the entire application in one prompt.
- Do not mark a task done if its acceptance criteria are not met.

### 10.5 Mandatory agent execution loop

For each task, the agent must:

1. **Inspect:** Read `RULES.md`, the relevant plan/task, current `PROGRESS.md`, and the affected code. Check repository status and existing patterns before editing.
2. **Clarify:** Identify unknown requirements, conflicts, dependencies, and privacy/security implications. Ask before assuming consequential business rules.
3. **Plan:** State a short implementation plan and identify the smallest reasonable set of changes.
4. **Implement:** Make only changes needed for the task. Reuse existing conventions and components. Avoid unrelated refactors.
5. **Verify:** Run applicable syntax checks, automated tests, builds, migration checks, and/or manual test steps. Inspect the actual results.
6. **Fix and retest:** Resolve failures caused by the change and repeat relevant checks.
7. **Review:** Check for security regressions, leaked secrets, unauthorized data exposure, broken mobile layouts, and unintended changes.
8. **Document:** Update relevant API/database/architecture documentation, task status, and `PROGRESS.md`.
9. **Report:** Summarize files changed, behavior implemented, tests actually run and their results, known limitations, and the next task.

The agent must never claim a test passed unless it actually ran successfully or the result was independently provided. If a test cannot be run, state why and provide the exact outstanding verification step.

### 10.6 Persistent progress format

`PROGRESS.md` should remain concise and current:

```md
# Project Progress
- Current phase:
- Current task:
- Overall status:
- Last verified commit/change:
- Last verification date:

## Completed
- [x] TASK-XXX — brief result and verification evidence

## In progress
- [ ] TASK-XXX — current state and remaining work

## Blocked / decisions needed
- Question or blocker — who/what is needed

## Known issues
- Issue, impact, and next action

## Next recommended task
- TASK-XXX — reason it is the next dependency-safe step
```

Update this file at the end of each completed task or when a blocker materially changes project state. Do not record a task as complete based solely on generated code.

### 10.7 Agent safety boundaries

The agent must not, without explicit approval:

- Change the stack or install a major dependency.
- Delete or overwrite user data, project files, migrations, or working features.
- Run destructive SQL against a database containing valuable data.
- Change production configuration, deploy publicly, or run irreversible commands.
- Invent medical-center policies, appointment rules, staff roles, or legal requirements.
- Use real patient data in tests or external AI prompts.
- Bypass authentication, authorization, validation, privacy controls, or tests to make a demo work.
- Create fake test results, mock successful API responses as if they came from the real backend, or claim unverified features work.
- Perform broad refactors unrelated to the current task.

Before changing a database schema, create a migration and explain compatibility and rollback implications. Before a destructive operation, require a verified backup and explicit approval.

### 10.8 Verification and evidence

Verification must match the task. Examples:

- Frontend change: run the production build and test relevant mobile layouts and UI states.
- PHP change: run PHP syntax checks and relevant API tests.
- Database change: apply migrations to a disposable/test database, verify constraints, and test both valid and invalid data.
- Authentication/authorization change: test unauthenticated, unauthorized, and authorized requests.
- Appointment workflow change: test allowed and forbidden status transitions, capacity boundaries, and concurrent booking behavior where applicable.
- Full vertical slice: verify browser → API → database behavior end to end.
- Deployment change: follow a repeatable deployment checklist and confirm configuration, HTTPS, backups, and recovery.

Use commands that exist in the repository and report exact commands and outcomes. Do not introduce a large testing framework solely for a single task without considering project-wide value.

### 10.9 Definition of Done for every task

A task is `Done` only when all applicable items are satisfied:

- Acceptance criteria are met.
- Implementation follows `RULES.md` and approved architecture.
- Relevant verification has been run and results are recorded.
- No known critical regression or exposed secret is introduced.
- Inputs, errors, loading states, and empty states are handled where relevant.
- UI changes are tested mobile-first and checked at larger breakpoints.
- API and database documentation are updated if contracts or schema changed.
- `TASKS.md` and `PROGRESS.md` reflect the actual state.
- Remaining limitations and unverified behavior are disclosed.

---

## 11. Development Phases and Milestones

Build incrementally. Do not begin the next major feature until the current phase's exit criteria are met or an explicit decision documents why work can proceed in parallel.

### Phase 0 — Requirements and project setup
**Goals**
- Confirm the clinic's services, appointment process, staff roles, hours, slot capacity, and cancellation/rescheduling rules.
- Confirm privacy notices, required personal data, data retention, and authorized access.
- Inspect the existing repository and preserve useful existing work.
- Initialize version control and the target directory structure.
- Create baseline project-control documents.

**Tasks**
- `TASK-001`: Confirm business rules and open questions.
- `TASK-002`: Initialize frontend and verify the production build.
- `TASK-003`: Initialize PHP API and verify the PHP runtime.
- `TASK-004`: Configure environment variables and `.gitignore`.
- `TASK-005`: Create MySQL database setup and migration workflow.
- `TASK-006`: Document architecture and local setup.

**Exit criteria**
- A new developer can follow the README to start the project.
- Frontend build and backend health check work.
- No secrets or real patient data are committed.
- Unresolved operational policies are documented, not guessed.

### Phase 1 — Technical foundation
**Goals**
- Establish consistent API responses, database connectivity, routing, layout, and error handling.
- Implement responsive design tokens and reusable UI patterns.
- Establish testing commands.

**Tasks**
- Database connection and health endpoint.
- API response/error conventions.
- Frontend router and base layouts.
- Shared form, button, dialog, table/card, loading, empty, and error patterns as needed.
- Logging and environment configuration.
- Initial backend and frontend tests.

**Exit criteria**
- Frontend can call the PHP API.
- Database connection is verified without exposing credentials.
- Error behavior is consistent.
- Mobile-first base layout works at narrow widths.

### Phase 2 — Public appointment request vertical slice
**Goals**
- Deliver a complete resident workflow from the mobile UI through the API to MySQL.

**Tasks**
- Create approved service/schedule schema and migrations.
- Implement public services and availability endpoints.
- Implement server-side validation and appointment creation.
- Build mobile-first appointment form and review/confirmation UI.
- Implement capacity and duplicate-submission protections.
- Add success, validation, loading, empty, and error states.
- Add API and end-to-end verification.

**Exit criteria**
- A resident can submit a valid request on a mobile device.
- Valid requests persist in MySQL with `pending` status.
- Invalid requests are rejected safely.
- Availability rules are enforced on the server.
- Concurrent requests cannot exceed configured capacity.
- No private patient or appointment information is exposed publicly.

### Phase 3 — Staff authentication and permissions
**Goals**
- Establish secure staff access before building protected administrative features.

**Tasks**
- Staff account and role schema.
- Login/logout and current-session endpoint.
- Password hashing and verification.
- Session cookie settings, expiration, and CSRF protection where applicable.
- Backend authorization middleware/policies.
- Login page and protected route behavior.
- Tests for unauthenticated, unauthorized, and authorized requests.

**Exit criteria**
- Staff can sign in and out.
- Protected endpoints reject unauthorized requests even if called directly.
- Role restrictions are enforced server-side.
- Session and error handling are verified.

### Phase 4 — Appointment administration
**Goals**
- Enable authorized staff to process public requests.

**Tasks**
- Appointment list, filters, pagination, and detail view.
- Approve/reject actions and required reasons.
- Reschedule/cancel behavior based on approved rules.
- Complete/no-show actions.
- Status history and audit events.
- Responsive mobile/tablet/desktop administrative views.
- Workflow, permission, and concurrency tests.

**Exit criteria**
- Staff can process appointments according to the approved workflow.
- Invalid status transitions are rejected.
- Capacity remains correct after approvals, cancellations, or rescheduling.
- Relevant actions are auditable.

### Phase 5 — Patient/resident records
**Goals**
- Provide authorized patient record management with privacy safeguards.

**Tasks**
- Patient schema and migrations.
- Create/update/search endpoints with pagination.
- Duplicate detection and resolution workflow.
- Responsive patient list, detail, and forms.
- Authorization and data-minimization tests.

**Exit criteria**
- Authorized staff can create, search, and update records.
- Unauthorized users cannot retrieve patient data.
- Search results are bounded and do not expose unnecessary fields.
- Duplicate handling is defined and tested.

### Phase 6 — Consultation records
**Goals**
- Support approved consultation documentation for authorized staff.

**Tasks**
- Confirm required consultation fields and edit/correction policy.
- Create schema and migrations.
- Implement create/read endpoints and authorization.
- Build consultation entry and history views.
- Add audit trail where required.
- Test access control and validation.

**Exit criteria**
- Only authorized staff can create or view consultation records.
- Required data and patient relationships are validated.
- Consultation information is not exposed through public endpoints.
- Sensitive actions are auditable according to the approved policy.

### Phase 7 — Dashboard, reports, and administration
**Goals**
- Deliver operational summaries and approved administrative functions.

**Tasks**
- Dashboard metrics.
- Appointment reports with date and status filters.
- Staff/service/schedule administration based on permissions.
- Audit-log views for authorized roles.
- Export controls and privacy checks.
- Performance checks for expected data volume.

**Exit criteria**
- Report totals match database queries for defined test cases.
- Role permissions apply to reports and exports.
- Exported files contain only authorized fields.
- Large result sets are handled safely.

### Phase 8 — System hardening and user acceptance testing
**Goals**
- Validate the full system against real operational scenarios using synthetic data.

**Tasks**
- Regression testing across all workflows.
- Security review of authentication, authorization, input validation, sessions, public endpoints, and logs.
- Responsive testing on mobile, tablet, and desktop.
- Accessibility and keyboard checks for critical workflows.
- Performance and low-bandwidth checks.
- Backup/restore rehearsal.
- Staff user-acceptance testing.
- Fix defects and record remaining risks.

**Exit criteria**
- Critical and high-severity defects are resolved or formally accepted by the project owner.
- Backup restoration is demonstrated.
- User acceptance criteria are signed off.
- No real patient data is used in development test fixtures.

### Phase 9 — Deployment and handover
**Goals**
- Deploy the approved release to an appropriate PHP/MySQL hosting environment and prepare staff for use.

**Tasks**
- Configure production environment and HTTPS.
- Apply migrations with a reviewed deployment procedure.
- Configure least-privilege database credentials.
- Set up backups, monitoring, and operational contacts.
- Create deployment and rollback instructions.
- Train staff and provide a concise user guide.
- Run post-deployment smoke tests.

**Exit criteria**
- Public residents can reach the online portal.
- Staff access is secure and role-restricted.
- Production configuration contains no development secrets.
- Backup, recovery, and rollback procedures are documented and verified.
- The project owner approves the release.

---

## 12. MVP Priorities

### MVP — required before pilot
- Public appointment request.
- Approved service/schedule/availability configuration.
- Staff authentication and authorization.
- Appointment review and status workflow.
- Patient records sufficient for the approved process.
- Consultation records only if required for the initial pilot and properly governed.
- Essential dashboard/reporting.
- Audit events for sensitive operations.
- Privacy notice, backup plan, and deployment checklist.
- Automated/repeatable verification for critical workflows.

### Later enhancements
- SMS/email notifications after provider and cost approval.
- More advanced reports and exports.
- Queue management.
- Optional resident status lookup using a privacy-preserving design.
- Integrations with other systems, subject to approval and security review.

Do not expand the MVP without recording the reason, impact, and approval.

---

## 13. Testing Strategy

Use the smallest testing setup that provides reliable coverage, and expand it as the project grows.

### Frontend
- Production build.
- Component/form validation tests for important workflows.
- Responsive layout checks at narrow mobile, tablet, and desktop sizes.
- Loading, empty, success, and error states.
- Keyboard navigation for critical forms and dialogs.

### Backend
- PHP syntax checks.
- Unit or integration tests for business rules and validation.
- API tests for expected status codes and response shapes.
- Authorization tests for every protected resource family.
- Safe error handling tests.

### Database
- Apply migrations to an empty disposable database.
- Validate foreign keys, unique constraints, and indexes.
- Test transactions and rollback behavior.
- Test duplicate and invalid input handling.
- Test appointment capacity and concurrent booking protections.

### End-to-end
- Public resident submits a request.
- Staff signs in and reviews it.
- Staff approves or rejects it.
- Appointment state and audit history persist correctly.
- Unauthorized access is denied.
- Patient and consultation information remains protected.

Record the exact verification commands in `docs/TESTING.md`. The agent must not claim a test passed unless it has actually run and observed the result.

---

## 14. UI/UX Direction

- Mobile-first, responsive, accessible, and easy to understand for residents with varied digital literacy.
- Use plain language for public-facing labels and instructions.
- Keep appointment forms short and ask only for required information.
- Provide visible progress, validation messages, confirmation, and recovery from errors.
- Make touch targets comfortable and text readable at small sizes.
- Keep staff navigation predictable and task-oriented.
- Use consistent design tokens and reusable components.
- Avoid unnecessary animation, heavy images, and large dependencies.
- Do not rely on color alone to convey status.
- Protect private details from appearing in public screens, notifications, URLs, or browser titles.
- Test real workflows on mobile dimensions before polishing desktop layouts.

---

## 15. Task Backlog and Delivery Tracking

Maintain `TASKS.md` as the single source of truth for actionable work. Use one task ID per discrete piece of work and track dependencies.

Suggested status flow:

`Backlog → Ready → In Progress → In Review → Done`

Use `Blocked` whenever a task cannot safely proceed. Do not mark a task `Done` until the definition of done in Section 10.9 is met.

### Suggested initial backlog

| ID | Task | Depends on |
|---|---|---|
| TASK-001 | Confirm clinic rules, service list, hours, capacity, and privacy requirements | None |
| TASK-002 | Initialize React/Vite frontend and verify build | None |
| TASK-003 | Initialize PHP API and health endpoint | None |
| TASK-004 | Add environment configuration and ignore secrets | TASK-002, TASK-003 |
| TASK-005 | Establish MySQL migration workflow | TASK-003 |
| TASK-006 | Document architecture, API conventions, and test commands | TASK-002, TASK-003 |
| TASK-007 | Implement database connection and API error conventions | TASK-005 |
| TASK-008 | Implement approved services/availability data model | TASK-001, TASK-005 |
| TASK-009 | Implement public availability endpoint | TASK-007, TASK-008 |
| TASK-010 | Implement public appointment creation endpoint | TASK-009 |
| TASK-011 | Build mobile-first public booking UI | TASK-002, TASK-009 |
| TASK-012 | Verify public booking end to end | TASK-010, TASK-011 |
| TASK-013 | Implement staff authentication and session security | TASK-007 |
| TASK-014 | Implement staff authorization policies | TASK-013 |
| TASK-015 | Implement appointment administration | TASK-012, TASK-014 |

Add detailed acceptance criteria and verification commands before moving each task to `Ready`.

---

## 16. Project Risks and Decisions Needed

Resolve these before the affected feature is implemented:

- Which appointment services are offered?
- What are the clinic's operating hours, holidays, slot durations, and capacity rules?
- Are appointment requests always pending staff approval?
- How are duplicate residents/patients identified and resolved?
- Which staff roles exist, and what can each role read or change?
- What fields are required in a consultation record?
- What is the correction policy for completed consultation records?
- What privacy notice, retention period, and authorized disclosure process apply?
- Will the system send SMS/email notifications, and who approves the provider and cost?
- Where will the production system be hosted, who will maintain it, and how will backups be protected?
- What are the approved recovery time and data-loss tolerances?

Record final decisions in `docs/DECISIONS.md` with the date, decision, rationale, owner/approver, and affected tasks. Do not allow an agent to invent answers to these questions.

---

## 17. Final Release Checklist

Before release, verify:

- [ ] Project owner has approved the scope and operational rules.
- [ ] All release-blocking tasks are `Done`.
- [ ] Frontend production build succeeds.
- [ ] Backend syntax and critical API tests pass.
- [ ] Database migrations work from a clean database.
- [ ] Authentication and authorization have been tested directly against the API.
- [ ] Appointment capacity and state transitions are verified.
- [ ] Patient and consultation records are protected.
- [ ] Mobile-first layouts are verified on narrow screens and checked on tablet/desktop.
- [ ] No secrets or real patient data are committed.
- [ ] Privacy notice, access controls, and audit logging are reviewed.
- [ ] Backup restoration has been tested.
- [ ] Deployment and rollback instructions are current.
- [ ] Staff have received necessary training and operating instructions.
- [ ] Post-deployment smoke tests pass.
- [ ] Remaining limitations and risks are explicitly accepted by the project owner.

---

## 18. Governing Principle

**Build ACMIS in small, verified, mobile-first vertical slices.** Keep the stack simple, enforce security at the backend, preserve project context in documentation, and require evidence before declaring work complete. AI agents may accelerate implementation, but the project owner remains the approver of business rules, privacy decisions, architecture changes, and production release.
