# ACMIS Database

Status: **Workflow established 2026-10-15 (`database/README.md` + comment-only template); zero real migrations committed.** `database/migrations/` contains only `00000000000000_template.sql`; `database/seeders/` contains only `README.md` (verified 2026-10-15). No tables, columns, constraints, or indexes exist. Live apply on a disposable database is Outstanding (no MySQL in this environment).

Path truth: root-level `database/` (see `docs/DECISIONS.md` 2026-10-15 entry). Not `backend/database/` — the diagrams in `RULES.md §4` / `DEVELOPMENT_PLAN.md §3` are outdated on this point.

Update rule (mandatory per `RULES.md §7`): update this file when tables, columns, constraints, relationships, indexes, or migration procedures change.

## Planned entities (all Planned — no schema claims)

From `DEVELOPMENT_PLAN.md §7` (planning baseline only, not an instruction to create all tables now):
- `staff_users` — Planned
- `roles` / `staff_user_roles` — Planned
- `patients` — Planned
- `appointment_services` — Planned
- `clinic_schedules` / `appointment_slots` — Planned
- `appointments` — Planned
- `appointment_status_history` — Planned
- `consultations` — Planned
- `audit_logs` — Planned
- `system_settings` — Planned

No column types, nullability, defaults, keys, or indexes are defined yet. Detailed design is deferred to product TASK-008 after TASK-001 business rules are confirmed.

## Migration workflow (established 2026-10-15, pending TASK-005 live verify)

- Engine: MySQL; version-controlled SQL files under `database/migrations/`; synthetic seeds under `database/seeders/` only. Full procedure in `database/README.md`.
- Naming: `YYYYMMDDHHMMSS_description.sql`, applied in filename order; one logical change per file.
- Every variable-input query uses PDO prepared statements; never concatenate untrusted input (`RULES.md §7`).
- Multi-step writes use transactions; capacity enforcement considers concurrent requests + isolation.
- Fresh-DB procedure (create empty DB + apply all migrations) is TBD pending TASK-005; must be documented and verified on a disposable/test database before production.
- Timestamp/time-zone policy: TBD (must be documented when first timestamp column lands).

## Safety rules
- Synthetic test data only; never seed with real patient information.
- No manual prod schema edits without an approved repeatable migration plan.
- No destructive SQL (drop/truncate/delete user data) without explicit approval + verified backup.
- No migration that silently discards existing data.

---
## Related notes
- Role: spec — schema plan + migration workflow (zero real migrations).
- Governed by: [[RULES]] · [[DEVELOPMENT_PLAN]] · [[docs/DECISIONS|DECISIONS]] (root `database/`)
- Workflow detail: [[database/README|database workflow]] · Seeds: [[database/seeders/README|seeders guide]]
- Contracts: [[docs/API|API]] · Boundaries: [[docs/ARCHITECTURE|ARCHITECTURE]]
- Verified by: [[docs/TESTING|TESTING]] · Deploys via: [[docs/DEPLOYMENT|DEPLOYMENT]]
