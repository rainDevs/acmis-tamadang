-- Migration: 20261016000010_create_appointment_status_history.sql
-- Author: ACMIS agent (TASK-015)
-- Date: 2026-10-16
-- Purpose: Audit trail for staff status changes (actor + timestamp per
--   RULES.md §10). One row per staff action; the initial online request has
--   no row (no backfill — pre-existing rows simply show an empty history).
-- Rollback: DROP TABLE `appointment_status_history`;

START TRANSACTION;

CREATE TABLE `appointment_status_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `appointment_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('pending','approved','rejected','cancelled','completed','no_show') NOT NULL,
  `actor_user_id` BIGINT UNSIGNED NOT NULL,
  `note` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_status_history_appointment` FOREIGN KEY (`appointment_id`)
    REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_status_history_actor` FOREIGN KEY (`actor_user_id`)
    REFERENCES `staff_users` (`id`) ON DELETE RESTRICT,
  INDEX `idx_status_history_appointment` (`appointment_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
