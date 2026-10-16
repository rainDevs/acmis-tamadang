-- Migration: 20261016000008_add_description_to_staff_users.sql
-- Author: ACMIS agent (staff accounts extension)
-- Date: 2026-10-16
-- Purpose: Free-text note per staff account (e.g. duty assignment), requested
--   by project owner. Nullable, unused by the API for now; staff
--   administration UI (later task) will surface it.
-- Rollback: ALTER TABLE `staff_users` DROP COLUMN `description`;

START TRANSACTION;

ALTER TABLE `staff_users`
  ADD COLUMN `description` VARCHAR(255) NULL DEFAULT NULL AFTER `role`;

COMMIT;
