-- Seeder: 20261016000003_announcements.sql
-- Board reference rows, moved verbatim from frontend mockData.js (TASK-025).
-- Same public copy, no new content invented. Final copy is owned by the
-- health center; editing UI lands in TASK-021. Apply once per database.

START TRANSACTION;

INSERT INTO `announcements` (`type`, `title`, `body`, `pinned`, `posted_at`) VALUES
  ('schedule', 'Immunization day every Wednesday morning', 'Routine vaccines for infants and children are given Wednesday, 8:00 AM – 12:00 NN. Bring the child’s immunization card.', 1, '2026-10-18'),
  ('holiday', 'No consultations on public holidays', 'The center follows national holidays. Requests for holiday dates will be rescheduled to the next open day.', 0, '2026-10-15'),
  ('reminder', 'Bring a valid ID and your reference number', 'On your visit, show any valid ID plus the reference number from your request so staff can find your record fast.', 0, '2026-10-12'),
  ('notice', 'Online requests are reviewed within one working day', 'A submitted request stays pending until staff confirm it. Check your status here — no need to call or walk in.', 0, '2026-10-10');

COMMIT;
