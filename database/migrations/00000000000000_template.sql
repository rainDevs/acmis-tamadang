-- ACMIS migration template (comment-only: safe to apply, changes nothing).
-- Copy to YYYYMMDDHHMMSS_short_description.sql and fill in.
-- One logical change per file. See database/README.md + RULES.md §7.

-- Migration: <filename>
-- Author: <name>
-- Date: <YYYY-MM-DD>
-- Purpose: <one sentence>
-- Rollback: <how to reverse, or "irreversible: <reason + approval ref>">

START TRANSACTION;

-- Write static SQL only. No untrusted input. Example shape (keep commented until real):
-- CREATE TABLE `example` (
--   `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 1;

COMMIT;
