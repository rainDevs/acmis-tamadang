# ACMIS Database

Status: **Zero migrations committed as of 2026-10-15.** `database/migrations/` and `database/seeders/` exist but contain no files (verified 2026-10-15). No tables, columns, constraints, or indexes exist.

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

## Migration workflow (Planned, pending TASK-005)

- Engine: MySQL; version-controlled SQL files under `database/migrations/`; synthetic seeds under `database/seeders/` only.
- Every variable-input query uses PDO prepared statements; never concatenate untrusted input (`RULES.md §7`).
- Multi-step writes use transactions; capacity enforcement considers concurrent requests + isolation.
- Fresh-DB procedure (create empty DB + apply all migrations) is TBD pending TASK-005; must be documented and verified on a disposable/test database before production.
- Timestamp/time-zone policy: TBD (must be documented when first timestamp column lands).

## Safety rules
- Synthetic test data only; never seed with real patient information.
- No manual prod schema edits without an approved repeatable migration plan.
- No destructive SQL (drop/truncate/delete user data) without explicit approval + verified backup.
- No migration that silently discards existing data.
