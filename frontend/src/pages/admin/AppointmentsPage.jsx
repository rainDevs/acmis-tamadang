import AppointmentList from '@/features/staff/AppointmentList'
import Reveal from '@/components/shared/Reveal'
import { useStaffSession } from '@/features/staff/useStaffSession'

// Staff request queue (live since TASK-015). Filters, search, and
// pagination here mirror the list-endpoint query params.
export default function AppointmentsPage() {
  const { sessionUser } = useStaffSession()
  const canReview = sessionUser?.role === 'superadmin' || sessionUser?.role === 'admin'
  return (
    <div>
      <Reveal>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Appointment requests</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {canReview
            ? 'Review resident requests. Approvals and rejections are recorded with your name and timestamp.'
            : 'Review resident requests. Your staff account can view requests; approvals need an admin account.'}
        </p>
      </Reveal>
      <Reveal delay={0.06}>
        <div className="mt-5">
          <AppointmentList />
        </div>
      </Reveal>
    </div>
  )
}
