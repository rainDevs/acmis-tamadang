-- Migration: 20261016000006_create_staff_users.sql
-- Author: ACMIS agent (TASK-013)
-- Date: 2026-10-16
-- Purpose: Staff accounts for password authentication. Role names are the
--   approved Q-05 set (Superadmin, Admin, Staff); the granular permission
--   matrix is deferred to TASK-014. Passwords live here ONLY as hashes
--   created by PHP password_hash() (see backend/scripts/create_staff.php) —
--   never plaintext, never in seeds.
-- Rollback: DROP TABLE `staff_users`; (destroys staff accounts; recreate via
--   backend/scripts/create_staff.php afterwards.)

START TRANSACTION;

CREATE TABLE `staff_users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `role` ENUM('superadmin','admin','staff') NOT NULL DEFAULT 'staff',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `uq_staff_users_username` UNIQUE (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
