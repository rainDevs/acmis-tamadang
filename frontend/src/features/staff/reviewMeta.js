// Review-screen constants (TASK-015). Button rendering only — the API is
// authoritative (AppointmentAdminService::TRANSITIONS); NEXT_ACTIONS mirrors
// it so the UI offers nothing the server would reject.

export const STAFF_STATUSES = ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'no_show']

// Which action buttons render per current status. Terminal states offer none.
export const NEXT_ACTIONS = {
  pending: ['approved', 'rejected'],
  approved: ['completed', 'no_show', 'cancelled'],
  rejected: [],
  cancelled: [],
  completed: [],
  no_show: [],
}

export const ACTION_LABELS = {
  approved: 'Approve',
  rejected: 'Reject',
  completed: 'Mark completed',
  no_show: 'Mark no-show',
  cancelled: 'Cancel appointment',
}
