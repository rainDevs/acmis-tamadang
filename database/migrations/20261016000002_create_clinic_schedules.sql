-- Migration: 20261016000002_create_clinic_schedules.sql
-- Author: ACMIS agent (TASK-008)
-- Date: 2026-10-16
-- Purpose: Weekly recurring schedule template. Approved hours (docs/DECISIONS.md
--   2026-10-16, Q-02): Monday-Friday, 08:00-17:00, 30-minute slots,
--   1 patient per slot. `service_id` NULL means the row applies to all services
--   (all approved services share the same hours today); a future approved
--   per-service exception can add a service-specific row.
-- Rollback: DROP TABLE `clinic_schedules`; (destroys template rows; re-seed
--   via database/seeders/20261016000002_clinic_schedules_weekday.sql afterwards.)
-- Time-zone policy: `start_time` / `end_time` are Asia/Manila wall-clock TIME
--   (no conversion). See docs/DATABASE.md.

START TRANSACTION;

CREATE TABLE `clinic_schedules` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `service_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'NULL = applies to all services',
  `day_of_week` TINYINT NOT NULL COMMENT 'ISO-8601: 1=Monday .. 7=Sunday',
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `slot_duration_minutes` SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  `capacity_per_slot` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_clinic_schedules_service` FOREIGN KEY (`service_id`)
    REFERENCES `appointment_services` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_clinic_schedules_dow` CHECK (`day_of_week` BETWEEN 1 AND 7),
  CONSTRAINT `chk_clinic_schedules_window` CHECK (`end_time` > `start_time`),
  CONSTRAINT `chk_clinic_schedules_slot` CHECK (`slot_duration_minutes` > 0),
  CONSTRAINT `chk_clinic_schedules_capacity` CHECK (`capacity_per_slot` >= 1),
  INDEX `idx_clinic_schedules_lookup` (`is_active`, `day_of_week`, `service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
