-- Migration: 20261016000007_create_staff_login_attempts.sql
-- Author: ACMIS agent (TASK-013)
-- Date: 2026-10-16
-- Purpose: Login throttling state (RULES.md §8). 5 failed attempts lock a
--   username for 5 minutes (constants in AuthService). Stores counts and
--   timestamps only — never passwords or hashes.
-- Rollback: DROP TABLE `staff_login_attempts`;

START TRANSACTION;

CREATE TABLE `staff_login_attempts` (
  `username` VARCHAR(50) NOT NULL PRIMARY KEY,
  `failures` INT UNSIGNED NOT NULL DEFAULT 0,
  `locked_until` DATETIME NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
