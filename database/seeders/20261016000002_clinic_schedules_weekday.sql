-- Seeder: 20261016000002_clinic_schedules_weekday.sql
-- Approved reference data (docs/DECISIONS.md 2026-10-16, Q-02): Monday-Friday,
-- 08:00-17:00, 30-minute slots, 1 patient per slot. `service_id` NULL = applies
-- to all services. Apply once on a fresh database after all migrations.

START TRANSACTION;

INSERT INTO `clinic_schedules`
  (`service_id`, `day_of_week`, `start_time`, `end_time`, `slot_duration_minutes`, `capacity_per_slot`, `is_active`)
VALUES
  (NULL, 1, '08:00:00', '17:00:00', 30, 1, 1),
  (NULL, 2, '08:00:00', '17:00:00', 30, 1, 1),
  (NULL, 3, '08:00:00', '17:00:00', 30, 1, 1),
  (NULL, 4, '08:00:00', '17:00:00', 30, 1, 1),
  (NULL, 5, '08:00:00', '17:00:00', 30, 1, 1);

COMMIT;
