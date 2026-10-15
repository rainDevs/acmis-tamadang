# ACMIS Coding Rules
## Appointment Consultation and Medical Information System

**Project:** Barangay Tamadang Health Center, Kiamba, Sarangani Province  
**Purpose:** Mandatory engineering, security, privacy, and AI-agent operating rules for ACMIS  
**Applies to:** All developers, AI coding agents, generated code, tests, scripts, migrations, and deployment changes

> These rules are mandatory. If a task cannot comply with them, stop, explain the conflict, and ask for approval. Do not silently bypass a rule to make a feature appear to work.

---

## 1. Rule Priority and Change Control

Use this order when requirements conflict:

1. Explicit instructions from the project owner for the current task.
2. This `RULES.md` for mandatory engineering, security, privacy, and workflow requirements.
3. Approved decisions in `docs/DECISIONS.md`.
4. `DEVELOPMENT_PLAN.md` for scope, milestones, and project sequencing.
5. The current task and acceptance criteria in `TASKS.md`.
6. Existing implementation conventions, when they do not conflict with the above.

If requirements conflict or a consequential business rule is unclear, do not guess. Explain the conflict, identify the affected feature, and ask the project owner for a decision.

Do not change these rules, the approved stack, the security model, database contracts, or project scope without explicit approval. Record approved consequential decisions in `docs/DECISIONS.md`.

---

## 2. Core Engineering Principles

- Prefer simple, maintainable, readable code over clever or unnecessarily abstract code.
- Follow KISS, DRY, and appropriate separation of concerns. Do not create abstractions without a real use case.
- Keep each task focused and avoid unrelated refactoring.
- Reuse existing components, conventions, and dependencies when they are appropriate.
- Do not duplicate business rules across unrelated modules.
- Do not silently remove existing features or change established behavior.
- Do not leave placeholder implementations, fake API results, or nonfunctional buttons in a feature claimed as complete.
- Do not claim behavior is implemented or tested unless there is evidence.
- Favor accessible, mobile-first interfaces and secure backend enforcement.
- Ask for clarification when a decision affects clinic policy, patient privacy, authorization, schema compatibility, or deployment safety.

---

## 3. Approved Technology Stack

Treat this stack as fixed unless the project owner explicitly approves a change and the decision is recorded.

### Frontend
- React 19
- Vite 8
- JavaScript
- Tailwind CSS v4
- shadcn/ui where appropriate
- React Router if client-side routing is needed
- A small, centralized API client for backend communication

### Backend
- PHP REST API
- PDO for MySQL access
- JSON requests and responses
- Server-side validation and authorization

### Database
- MySQL
- Version-controlled SQL migrations
- Foreign keys, constraints, indexes, and transactions where needed

### Development and hosting
- Local development may use XAMPP/Apache and MySQL.
- Public online booking requires deployment to an internet-accessible host that supports PHP and MySQL.
- Production must use HTTPS.
- Keep development, test, and production configuration separate.

### Prohibited without approval
- Replacing the approved frontend or backend stack.
- Introducing TypeScript, another backend framework, a new ORM, a major state-management library, or a large dependency without approval.
- Moving database access into the frontend.
- Changing deployment architecture or adding a paid external service without approval.
- Adding a dependency merely to avoid a small amount of straightforward code.

When proposing a stack or dependency change, explain the problem, alternatives, security and maintenance implications, migration effort, and ongoing cost.

---

## 4. Architecture and Boundaries

Use the following flow:

`Browser → React Frontend → PHP REST API → MySQL`

- The frontend must never connect directly to MySQL.
- The frontend is not a security boundary.
- Enforce authorization and business-critical validation on the server.
- Keep routing/controllers, business logic, and database access organized and testable.
- Use the simplest structure that fits the existing project. Do not create every possible folder or abstraction in advance.
- Do not expose stack traces, SQL errors, server paths, secrets, or sensitive records in responses.
- Do not use frontend-only checks as a substitute for backend validation or authorization.
- Keep API and database contracts consistent and document changes.

### Suggested structure

Adapt to the existing repository rather than restructuring it unnecessarily.

```text
acmis/
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── features/
│       ├── layouts/
│       ├── lib/
│       ├── pages/
│       ├── routes/
│       └── styles/
├── backend/
│   ├── public/
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
│   └── tests/
├── docs/
├── RULES.md
├── DEVELOPMENT_PLAN.md
├── TASKS.md
├── PROGRESS.md
├── .gitignore
└── README.md
```

This is a guide, not permission to move existing files without a reason.

---

## 5. Frontend Rules

### 5.1 React and JavaScript
- Use functional React components and hooks.
- Use JavaScript unless a stack change is approved.
- Keep components focused on one clear responsibility.
- Extract reusable components when reuse or consistency justifies it.
- Keep API calls in a consistent service/client layer rather than scattering fetch logic throughout the UI.
- Avoid giant components, duplicated forms, and deeply nested conditional rendering.
- Do not put secrets, database credentials, or privileged business logic in frontend code.
- Handle component loading, empty, success, validation, and error states where applicable.

### 5.2 Tailwind CSS and shadcn/ui
- Use Tailwind CSS v4 syntax and project conventions.
- Use shadcn/ui components where appropriate and customize them consistently.
- Do not introduce another UI library without approval.
- Prefer shared design tokens and reusable patterns over one-off styling.
- Avoid arbitrary values when a consistent token or existing utility is appropriate.
- Keep accessible labels, focus states, keyboard behavior, and dialog semantics.

### 5.3 Forms and tables
- Label every input clearly.
- Show field-level validation messages that explain how to correct the issue.
- Prevent accidental repeated submissions while a request is processing.
- Confirm destructive actions where appropriate.
- Provide loading, empty, success, and failure states.
- Tables must remain usable on mobile; use horizontal scrolling only where appropriate, or provide card/list layouts for small screens.
- Do not display sensitive patient details in list views unless the current role and workflow require them.

### 5.4 Mandatory mobile-first development
**ACMIS MUST be designed and implemented mobile-first. Mobile is the primary design target, not a secondary desktop adaptation.**

- Start with the smallest supported screen and progressively enhance for tablet and desktop.
- In Tailwind, unprefixed utilities define the mobile baseline; responsive prefixes enhance larger screens.
- Prioritize the resident appointment portal for small screens, low bandwidth, readable typography, short forms, and touch interaction.
- Keep staff workflows usable on mobile, including appointment review, patient search, and consultation entry.
- Use responsive navigation, card layouts, dialogs, and tables appropriate to the screen.
- Avoid fixed widths and layouts that create horizontal overflow.
- Minimize unnecessary JavaScript, heavy images, animations, and network requests.
- Test each major workflow at narrow mobile widths before checking tablet and desktop.
- Do not build desktop-first and retrofit mobile afterward.
- Mobile usability is an acceptance criterion for every UI task.

### 5.5 Accessibility and usability
- Use semantic HTML and appropriate labels.
- Support keyboard navigation for critical workflows.
- Ensure visible focus indicators and readable contrast.
- Do not rely on color alone to convey appointment status or validation.
- Use plain language for public-facing content.
- Keep forms as short as operationally possible and collect only necessary information.

---

## 6. Backend and API Rules

- Use PDO for database access.
- Use prepared statements for all queries containing variable input.
- Never concatenate untrusted input into SQL.
- Validate request method, content type, input type, length, allowed values, and relationships on the server.
- Treat all client-provided data as untrusted, including IDs, status values, role names, and hidden fields.
- Enforce authentication and authorization on every protected endpoint.
- Return consistent JSON and appropriate HTTP status codes.
- Use `400` or `422` for invalid input as defined by the API convention, `401` for unauthenticated requests, `403` for authenticated users without permission, `404` for inaccessible or nonexistent resources as appropriate to prevent information disclosure, and `500` for unexpected server errors.
- Do not return SQL errors, stack traces, file paths, secrets, or internal implementation details to clients.
- Log server-side diagnostic details safely without logging passwords, tokens, session IDs, or unnecessary medical details.
- Apply pagination and bounded result sizes to list endpoints.
- Verify record ownership/scope and related-record access before returning or changing data.
- Use transactions for related writes that must succeed or fail together.
- Keep controllers/endpoints small and move substantial business rules into testable functions/services where justified.
- Document endpoint behavior, parameters, response shapes, permissions, and errors in `docs/API.md`.
- Never treat a mocked response as proof that the real API works.

---

## 7. Database Rules

- Use MySQL and version-controlled SQL migrations.
- Define primary keys, foreign keys, appropriate indexes, and constraints.
- Use transactions for multi-step operations that must be atomic.
- Choose unique constraints based on confirmed business rules.
- Document the timestamp and time-zone policy.
- Keep schema changes backward-compatible when practical.
- Do not edit production schema manually without an approved, repeatable migration plan.
- Do not drop tables, truncate records, delete user data, or run destructive SQL without explicit approval and a verified backup.
- Test migrations against a disposable/test database before use in production.
- Verify that a new database can be created from the committed migrations and approved seeds.
- Do not seed the application with real patient information.
- Use synthetic data for development and tests.
- Update `docs/DATABASE.md` when tables, columns, constraints, relationships, indexes, or migration procedures change.
- Do not create a migration that silently discards existing data.
- Consider concurrent requests and transaction isolation for appointment availability and capacity enforcement.

---

## 8. Authentication, Authorization, and Sessions

- Store passwords only as secure hashes using PHP's supported password hashing APIs.
- Never store or log plaintext passwords.
- Enforce authorization in the backend on every protected endpoint.
- Do not rely only on hidden menu items or protected frontend routes.
- Use least-privilege roles and permissions approved by the project owner.
- Protect sessions against fixation and unauthorized reuse.
- Configure session cookies appropriately for the deployment, including `HttpOnly`, `Secure` under HTTPS, and a suitable `SameSite` policy.
- Apply session expiration and logout invalidation.
- Use CSRF protection when required by the cookie-based authentication model.
- Configure CORS narrowly; do not allow wildcard origins with credentials.
- Apply reasonable login throttling and abuse protections.
- Do not expose whether a patient exists through public authentication or lookup flows.
- Test unauthenticated, unauthorized, and authorized requests.
- Record security-relevant events without storing secrets or unnecessary medical content.

---

## 9. Privacy and Medical Information

ACMIS may process personal and sensitive personal information. Apply privacy-by-design and least-privilege principles, and confirm institutional/legal requirements with the responsible organization.

- Follow applicable Philippine data-protection requirements, including the Data Privacy Act of 2012.
- Collect only data needed for an approved operational purpose.
- Do not place real patient data in source code, test fixtures, prompts to external AI services, screenshots, public tickets, or sample files.
- Never expose consultation notes or patient history through public endpoints.
- Restrict sensitive records by role and task.
- Avoid returning fields the current user does not need.
- Do not put sensitive details in URLs, browser titles, notifications, or client-side logs.
- Do not log full medical notes, passwords, tokens, session identifiers, or other secrets.
- Define retention, access, correction, disclosure, backup, and incident-response procedures before production.
- Do not invent clinic policy, consent language, retention periods, medical fields, or legal conclusions. Record open questions and request approval.
- Do not generate automated diagnosis, triage, or treatment recommendations unless separately approved and appropriately clinically governed.
- Ensure exports and reports respect permissions and data-minimization requirements.

---

## 10. Appointment Business Rules

Use these canonical statuses unless the project owner approves and documents a change:

- `pending`
- `approved`
- `rejected`
- `cancelled`
- `completed`
- `no_show`

Rules:

- A new public request starts as `pending`.
- Only authorized staff may approve or reject a pending request.
- Enforce valid status transitions on the server.
- Record the staff actor and timestamp for status-changing actions.
- Availability and slot capacity are checked on the server, never only in the browser.
- Use database transactions and appropriate locking or constraints to prevent overbooking during concurrent requests.
- Prevent duplicate submissions where feasible.
- Releasing or reserving a slot during approval, cancellation, or rescheduling must follow the approved capacity model.
- Do not invent clinic hours, holidays, service duration, capacity, cancellation windows, or rescheduling policy.
- If an operational rule is unknown, mark the task blocked and ask the project owner.
- Add tests for allowed and forbidden transitions, invalid dates, full capacity, duplicate requests, and concurrent booking behavior where practical.

---

## 11. Patient and Consultation Records

- Collect and store only approved fields.
- Validate all required fields and relationships on the backend.
- Use role-based access to patient and consultation records.
- Search results must be bounded and display only fields needed for the task.
- Do not make consultation records publicly searchable.
- Confirm the duplicate-patient detection and resolution process before implementing it.
- Confirm whether completed consultations can be edited, and whether corrections require an audit trail.
- Audit sensitive create, view, update, export, and status-changing operations as required by the approved policy.
- Never silently overwrite important clinical information or erase history where an audit trail is required.
- Do not invent clinical workflows or fields.

---

## 12. Configuration, Dependencies, and Secrets

- Keep secrets and environment-specific settings outside version control.
- Provide a safe example environment file containing placeholders only.
- Ensure `.gitignore` excludes actual secrets, local overrides, logs, generated builds when appropriate, and real data dumps.
- Never print secrets in terminal output, screenshots, reports, or agent summaries.
- Do not hardcode production credentials.
- Pin and document dependencies through the project's package manager and lockfiles.
- Review a dependency's purpose, maintenance status, security implications, and bundle/runtime impact before adding it.
- Do not run destructive shell commands or scripts unless their effects are understood and authorized.
- Do not deploy, alter live infrastructure, or change production environment variables without explicit approval.

---

## 13. Error Handling and Logging

- Give users safe, actionable messages without exposing internal details.
- Log sufficient diagnostic context to investigate failures while minimizing personal information.
- Use consistent error formats across API endpoints.
- Never suppress errors merely to make a test or demo pass.
- Do not use empty catch blocks for errors that need handling.
- Do not report success when the database operation failed.
- Ensure failed multi-step writes roll back appropriately.
- Report unknown or unhandled errors honestly and safely.
- Include request or correlation identifiers where useful, without embedding personal or medical details.

---

## 14. Testing and Verification Rules

Verification must match the change. Use commands that actually exist in the repository.

### Frontend
- Run the production build for relevant UI changes.
- Test critical form validation and request states.
- Check mobile-first layout at narrow screen widths, then tablet and desktop.
- Check loading, empty, success, and error states.
- Test keyboard accessibility for critical interactions.

### Backend
- Run PHP syntax checks on changed PHP files.
- Run relevant unit, integration, or API tests.
- Test expected HTTP status codes and response formats.
- Test invalid input, unauthenticated requests, and unauthorized requests.
- Confirm errors do not leak internal details.

### Database
- Apply migrations to a disposable/test database.
- Test constraints, foreign keys, transactions, and rollback behavior.
- Test duplicate and invalid data.
- Test appointment capacity and concurrent booking protection where relevant.
- Confirm a clean database can be created using documented instructions.

### Integration
- Verify the actual browser → API → database flow.
- Do not substitute mocked API responses for integration evidence.
- Verify persisted results rather than relying only on a success toast.
- Test important workflows from the user's perspective.

### Reporting results
- Never claim a test passed unless it was actually run and its result observed.
- State exact commands and outcomes.
- If a test cannot run, state why and list the outstanding verification.
- Do not hide failing tests or weaken/remove tests merely to obtain a green result.
- Do not mark a task `Done` while its required verification is incomplete.

---

## 15. Mandatory Agentic-Development Workflow

These rules are mandatory for AI coding agents. They apply to every task, including small fixes.

### 15.1 Before starting
1. Read this `RULES.md`.
2. Read the relevant section of `DEVELOPMENT_PLAN.md`.
3. Read the task in `TASKS.md` and the latest `PROGRESS.md`.
4. Inspect the current code and project status before editing.
5. Identify dependencies, existing patterns, risks, and unconfirmed requirements.
6. If the repository state or user changes might be overwritten, stop and clarify before proceeding.

Do not assume that the repository matches a prior conversation or plan. Inspect the current files.

### 15.2 Clarify and plan
- Identify what is in scope and explicitly what is out of scope.
- Break broad work into smaller tasks before implementation.
- Ask questions when clinic policy, access rights, privacy, schema behavior, or deployment decisions are unclear.
- Give a concise plan naming the main files/modules and verification steps.
- Do not ask for approval for routine, reversible implementation details already covered by the rules.
- Do ask for approval before consequential changes described in these rules.

### 15.3 Implement narrowly
- Make the smallest coherent change that meets the acceptance criteria.
- Follow existing project conventions and reuse suitable components.
- Avoid unrelated refactoring and broad file rewrites.
- Do not generate the entire application in one task.
- Do not leave fake data, TODO placeholders, or nonfunctional controls in code claimed as complete.
- Keep mobile-first behavior and security in scope for every relevant change.

### 15.4 Verify and review
- Run applicable checks after implementation.
- Fix failures introduced by the change and rerun relevant checks.
- Review changed files for secret exposure, privacy leaks, authorization gaps, invalid assumptions, and accidental scope changes.
- Review mobile layout before larger breakpoints for UI work.
- If verification is blocked by unavailable tools, services, credentials, or environment, state the limitation and provide the exact next step.

### 15.5 Document and report
At the end of every task:
- Update the task status and verification evidence in `TASKS.md`.
- Update `PROGRESS.md` with completed work, current state, blockers, known issues, and the next recommended task.
- Update `docs/API.md`, `docs/DATABASE.md`, `docs/ARCHITECTURE.md`, `docs/TESTING.md`, or `docs/DEPLOYMENT.md` when relevant.
- Record approved consequential decisions in `docs/DECISIONS.md`.
- Report: summary, files changed, tests actually run and outcomes, unresolved issues, and the next logical task.

Do not claim completion or success without evidence. Distinguish clearly between implemented, tested, partially tested, and unverified behavior.

---

## 16. Agent Task Format and Sizing

Every task in `TASKS.md` should use this format:

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

### Task sizing rules
- A task should normally be small enough to implement and verify in one agent session.
- Prefer one coherent outcome per task.
- Split tasks that span several unrelated modules or require many independent assumptions.
- Use vertical slices when possible: database/API/UI/integration for one user workflow.
- Mark tasks `Blocked` when a required business decision or dependency is missing.
- Do not mark a task `Done` solely because files were generated.
- Keep one authoritative task status; do not maintain conflicting copies of the backlog.

Recommended task statuses:

`Backlog → Ready → In Progress → In Review → Done`

Use `Blocked` whenever safe progress cannot continue.

---

## 17. Persistent Project Context

Keep `PROGRESS.md` concise and current. Use a structure like:

```md
# ACMIS Project Progress
- Current phase:
- Current task:
- Overall status:
- Last verified change:
- Last verification date:

## Completed
- [x] TASK-XXX — outcome and verification evidence

## In progress
- [ ] TASK-XXX — current state and remaining work

## Blocked / decisions needed
- Question or blocker — what is needed to resolve it

## Known issues
- Issue, impact, and next action

## Next recommended task
- TASK-XXX — why it is the next dependency-safe task
```

Update progress after each task or when a meaningful blocker or project state changes. Preserve relevant context across agent sessions, but do not copy secrets or patient data into progress notes.

Use these supporting documents where applicable:

- `DEVELOPMENT_PLAN.md`: phases, milestones, scope, and project roadmap.
- `TASKS.md`: actionable tasks, dependencies, acceptance criteria, and status.
- `PROGRESS.md`: current state and next steps.
- `docs/ARCHITECTURE.md`: current architecture and module boundaries.
- `docs/API.md`: endpoint contracts and permissions.
- `docs/DATABASE.md`: schema and migration instructions.
- `docs/DECISIONS.md`: approved technical and business decisions.
- `docs/TESTING.md`: verification strategy and commands.
- `docs/DEPLOYMENT.md`: deployment, backup, restoration, and rollback.

Do not fabricate documentation for features that do not exist. Mark planned behavior as planned and implemented behavior as implemented.

---

## 18. Prohibited Agent Actions

Without explicit project-owner approval, an agent must not:

- Change the approved technology stack or add a major dependency.
- Invent clinic hours, appointment policies, staff roles, clinical fields, privacy policies, or legal requirements.
- Delete or overwrite user data, working features, migrations, or project files.
- Run destructive SQL against a database containing valuable data.
- Perform irreversible shell operations, deploy publicly, or modify live infrastructure.
- Change authentication architecture or weaken authorization.
- Bypass validation, security controls, or tests to make a demonstration work.
- Use real patient data in development or external AI prompts.
- Create fake test results or claim unverified behavior works.
- Silently change API contracts or schema behavior.
- Make broad refactors unrelated to the task.
- Mark incomplete work as `Done`.

Before any destructive operation, require a verified backup and explicit approval. Before a schema change, create a migration and explain data compatibility and rollback implications.

---

## 19. Definition of Done

A task is complete only when all applicable criteria are satisfied:

- [ ] The stated acceptance criteria are met.
- [ ] The implementation follows these rules and the approved architecture.
- [ ] Relevant tests and checks were actually run, with results recorded.
- [ ] No known critical regression or exposed secret was introduced.
- [ ] Input validation, error handling, and access control are addressed where applicable.
- [ ] Loading, empty, success, and failure states are handled where relevant.
- [ ] UI changes were designed and tested mobile-first and checked at larger breakpoints.
- [ ] API/database/architecture documentation is updated when contracts or behavior changed.
- [ ] `TASKS.md` and `PROGRESS.md` reflect the real status.
- [ ] Unverified behavior, limitations, and outstanding risks are disclosed.
- [ ] No fake data or placeholder behavior is represented as a working feature.

A task that cannot be fully verified must remain in review or be explicitly marked partially complete/blocked; do not misrepresent it as done.

---

## 20. Release and Production Safety

Before a production release:

- Obtain project-owner approval for scope and operational rules.
- Resolve or formally accept release-blocking issues.
- Verify the frontend production build and critical backend/API tests.
- Verify migrations from a clean database and prepare a reviewed migration procedure.
- Test authentication and authorization directly against the API.
- Test appointment capacity and status transitions.
- Review privacy notices, permissions, audit events, and exports.
- Use HTTPS and least-privilege production database credentials.
- Verify backup and restoration procedures.
- Document deployment, rollback, and incident contacts.
- Use synthetic test data; do not use real patient information for acceptance testing unless an explicitly approved, controlled process requires it.
- Run post-deployment smoke tests and record their actual results.

No agent may deploy a release or change live infrastructure without explicit approval.

---

## 21. Final Rule

**Build ACMIS in small, verified, mobile-first vertical slices.** The agent's responsibility is to implement within approved boundaries, test what it changes, preserve project context, and report evidence honestly. The project owner remains responsible for approving clinic policies, privacy decisions, consequential architecture changes, and production releases.
