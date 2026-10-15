-- Seeder: 20261016000001_appointment_services.sql
-- Approved reference data (docs/DECISIONS.md 2026-10-16, Q-01). Apply once on a
-- fresh database after all migrations. Contains no patient, contact, or
-- credential data — service names only.

START TRANSACTION;

INSERT INTO `appointment_services` (`name`, `description`, `duration_minutes`, `is_active`) VALUES
  ('General Consultation', NULL, 30, 1),
  ('Maternal and Child Health Care', NULL, 30, 1),
  ('Immunization and Vaccination', NULL, 30, 1),
  ('Senior Citizen Care', NULL, 30, 1),
  ('Vitals & Screening', NULL, 30, 1),
  ('Health Certificate / Clearance', NULL, 30, 1);

COMMIT;
