-- Migration: 20261016000001_create_appointment_services.sql
-- Author: ACMIS agent (TASK-008)
-- Date: 2026-10-16
-- Purpose: Approved service catalog. Names are the 6 services approved in
--   docs/DECISIONS.md (2026-10-16, Q-01). Duration default 30 mirrors the
--   approved uniform slot length (Q-02); per-row override allows a future
--   approved change without a schema edit.
-- Rollback: DROP TABLE `appointment_services`; (destroys catalog rows; re-seed
--   via database/seeders/20261016000001_appointment_services.sql afterwards.)
-- Time-zone policy: this table holds no wall-clock columns; `created_at` /
--   `updated_at` are TIMESTAMP (UTC storage). See docs/DATABASE.md.

START TRANSACTION;

CREATE TABLE `appointment_services` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL DEFAULT NULL,
  `duration_minutes` SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `uq_appointment_services_name` UNIQUE (`name`),
  CONSTRAINT `chk_appointment_services_duration` CHECK (`duration_minutes` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
