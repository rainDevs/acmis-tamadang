# ACMIS Database

Status: **4 real migrations + 2 seeders committed and live-verified 2026-10-16 (TASK-008 Done).** Applied in order to disposable `acmis_test` on local MySQL 8.0.43: 4 tables created, 6 services + 5 schedule rows seeded, 6 negative tests rejected with expected codes (1062/1452/3819×2/1265/1451), transaction rollback confirmed, disposable DB dropped afterwards. Details in `TASKS.md` TASK-008.

Path truth: root-level `database/` (see `docs/DECISIONS.md` 2026-10-15 entry). Not `backend/database/` — the diagrams in `RULES.md §4` / `DEVELOPMENT_PLAN.md §3` are outdated on this point.

Update rule (mandatory per `RULES.md §7`): update this file when tables, columns, constraints, relationships, indexes, or migration procedures change.

## Implemented tables (TASK-008 Done 2026-10-16 — live-verified on disposable MySQL 8.0.43)

All InnoDB / utf8mb4_unicode_ci. Source of values: `docs/DECISIONS.md` 2026-10-16 only.

- `appointment_services` — approved catalog (6 rows seeded). Columns: `id`, `name` UNIQUE, `description` NULL, `duration_minutes` default 30 CHECK > 0, `is_active`, `created_at`/`updated_at` TIMESTAMP.
- `clinic_schedules` — weekly template. Columns: `id`, `service_id` NULL (= all services) FK → services CASCADE, `day_of_week` 1–7 CHECK, `start_time`/`end_time` TIME CHECK end > start, `slot_duration_minutes` default 30, `capacity_per_slot` default 1 CHECK ≥ 1, `is_active`, timestamps. Seeded Mon–Fri 08:00–17:00.
- `schedule_closures` — holiday dates. Columns: `id`, `closure_date` DATE UNIQUE, `reason` NULL, timestamps. No seed rows (operational data, TASK-015).
- `appointments` — public requests. Columns: `id`, `reference_no` VARCHAR(20) UNIQUE, `service_id` FK → services RESTRICT, `appointment_date` DATE, `start_time` TIME, `requester_name`, `contact_number`, `status` ENUM (`pending`,`approved`,`rejected`,`cancelled`,`completed`,`no_show`) default `pending`, timestamps. Indexes on (service, date, time, status) and (status, date). Deliberately NO patient FK (registration happens at visit, Q-04) and NO staff-actor column (deferred to TASK-013); status history deferred to TASK-015.

## Timestamp / time-zone policy (set 2026-10-16, TASK-008)

- Slot wall-clock (`start_time`, `end_time`, `appointment_date`, `closure_date`): Asia/Manila local time, stored as DATE/TIME with no conversion.
- Audit (`created_at`, `updated_at`): TIMESTAMP (UTC storage), auto-defaulted.
- The API must never shift wall-clock slot values across zones; display converts audit timestamps to Asia/Manila.

## Planned entities (deferred)

From `DEVELOPMENT_PLAN.md §7` still deferred (not in TASK-008 scope):
- `staff_users` — Planned (TASK-013)
- `roles` / `staff_user_roles` — Planned (names approved: Superadmin, Admin, Staff; matrix deferred — TASK-013/014)
- `patients` — Planned (registration at visit per Q-04; later task)
- `appointment_status_history` — Planned (TASK-015)
- `consultations` — Planned (field structure approved Q-06; correction policy open; later task)
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
