-- Migration: 20261016000005_add_address_to_appointments.sql
-- Author: ACMIS agent (TASK-010 contract extension)
-- Date: 2026-10-16
-- Purpose: Persist the requester's address with each appointment request so
--   staff can verify legitimacy (approved in docs/DECISIONS.md 2026-10-16:
--   appointment address field). API validation requires a non-empty value
--   (max 255) for all new requests.
-- Rollback: ALTER TABLE `appointments` DROP COLUMN `address`; (destroys
--   stored addresses; names/contacts/requests are unaffected.)
-- Note: pre-existing rows predate this field and carry '' (unknown).

START TRANSACTION;

ALTER TABLE `appointments`
  ADD COLUMN `address` VARCHAR(255) NOT NULL DEFAULT '' AFTER `contact_number`;

COMMIT;
