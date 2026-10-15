// Synthetic mock data only. No real patient records.
// Shapes mirror DEVELOPMENT_PLAN §7 API contracts so PHP backend can replace these later.

export const mockServices = [
  {
    id: 'general',
    name: 'General Consultation',
    description: 'Common illness, follow-up, and health advice for all ages.',
    duration_minutes: 15,
    status: 'active',
  },
  {
    id: 'maternal',
    name: 'Maternal & Child Health',
    description: 'Prenatal checkups, postnatal visits, and child wellness.',
    duration_minutes: 20,
    status: 'active',
  },
  {
    id: 'immunization',
    name: 'Immunization',
    description: 'Routine vaccines for infants, children, and catch-up doses.',
    duration_minutes: 10,
    status: 'active',
  },
  {
    id: 'senior',
    name: 'Senior Citizen Care',
    description: 'Blood pressure monitoring, maintenance, and wellness checks.',
    duration_minutes: 15,
    status: 'active',
  },
  {
    id: 'bp',
    name: 'Vitals & Screening',
    description: 'BP taking, weight, temperature, and basic screening.',
    duration_minutes: 10,
    status: 'active',
  },
  {
    id: 'cert',
    name: 'Health Certificate / Clearance',
    description: 'School, work, or activity medical clearance requests.',
    duration_minutes: 15,
    status: 'active',
  },
]

// reference_no -> minimal public-safe status (never include diagnosis/notes)
export const mockAppointments = {
  'ACMIS-2026-000123': {
    reference_no: 'ACMIS-2026-000123',
    contact_suffix: '4567', // verification: last 4 of contact no (mock only)
    service_name: 'General Consultation',
    schedule_date: '2026-10-20',
    start_time: '08:30',
    status: 'pending',
  },
  'ACMIS-2026-000118': {
    reference_no: 'ACMIS-2026-000118',
    contact_suffix: '8910',
    service_name: 'Immunization',
    schedule_date: '2026-10-21',
    start_time: '09:00',
    status: 'approved',
  },
}

export const mockAvailability = [
  { date: '2026-10-20', service_id: 'general', slots_left: 12, capacity: 30 },
  { date: '2026-10-21', service_id: 'general', slots_left: 8, capacity: 30 },
  { date: '2026-10-20', service_id: 'immunization', slots_left: 5, capacity: 20 },
]

// Synthetic community board items. Final copy is owned by the health center.
export const mockAnnouncements = [
  {
    id: 'a1',
    type: 'schedule',
    pinned: true,
    date: '2026-10-18',
    title: 'Immunization day every Wednesday morning',
    body: 'Routine vaccines for infants and children are given Wednesday, 8:00 AM – 12:00 NN. Bring the child\u2019s immunization card.',
  },
  {
    id: 'a2',
    type: 'holiday',
    pinned: false,
    date: '2026-10-15',
    title: 'No consultations on public holidays',
    body: 'The center follows national holidays. Requests for holiday dates will be rescheduled to the next open day.',
  },
  {
    id: 'a3',
    type: 'reminder',
    pinned: false,
    date: '2026-10-12',
    title: 'Bring a valid ID and your reference number',
    body: 'On your visit, show any valid ID plus the reference number from your request so staff can find your record fast.',
  },
  {
    id: 'a4',
    type: 'notice',
    pinned: false,
    date: '2026-10-10',
    title: 'Online requests are reviewed within one working day',
    body: 'A submitted request stays pending until staff confirm it. Check your status here — no need to call or walk in.',
  },
]
