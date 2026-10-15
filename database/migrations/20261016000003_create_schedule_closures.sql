-- Migration: 20261016000003_create_schedule_closures.sql
-- Author: ACMIS agent (TASK-008)
-- Date: 2026-10-16
-- Purpose: Holiday/closure dates on which no slots are offered. Approved rule
--   (docs/DECISIONS.md 2026-10-16, Q-02): closed on holidays. Specific dates
--   are operational data entered by staff later (TASK-015); this migration only
--   creates the table.
-- Rollback: DROP TABLE `schedule_closures`;

START TRANSACTION;

CREATE TABLE `schedule_closures` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `closure_date` DATE NOT NULL COMMENT 'Asia/Manila wall-clock date; whole day closed',
  `reason` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `uq_schedule_closures_date` UNIQUE (`closure_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
