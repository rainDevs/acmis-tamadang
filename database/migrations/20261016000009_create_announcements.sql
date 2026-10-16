-- Migration: 20261016000009_create_announcements.sql
-- Author: ACMIS agent (TASK-025)
-- Date: 2026-10-16
-- Purpose: Community bulletin board, read-only public list. Reference rows
--   only — no patient, contact, or credential data. Publishing workflow
--   (who creates/edits) is deferred to TASK-021; no admin columns here.
-- Rollback: DROP TABLE `announcements`;

START TRANSACTION;

CREATE TABLE `announcements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `type` VARCHAR(20) NOT NULL DEFAULT 'notice',
  `title` VARCHAR(150) NOT NULL,
  `body` TEXT NOT NULL,
  `pinned` TINYINT(1) NOT NULL DEFAULT 0,
  `posted_at` DATE NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `chk_announcements_title` CHECK (CHAR_LENGTH(`title`) > 0),
  INDEX `idx_announcements_order` (`pinned`, `posted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
