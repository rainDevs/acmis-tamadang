import { useEffect, useState } from 'react'
import { NavLink } from 'react-router'
import { Inbox, KeyRound, LayoutDashboard, Megaphone, SlidersHorizontal, Stethoscope, Users } from 'lucide-react'
import { staffAppointmentList } from '@/services/api'
import { useStaffSession } from '@/features/staff/useStaffSession'
import { cn } from '@/lib/utils'

// Staff module navigation (approved IA — docs/DECISIONS.md 2026-10-16).
// Dashboard + Requests for every role; Services is admin+ only per the
// default RBAC matrix (hidden for staff, fail closed). Coming-soon modules
// render as non-interactive preview rows (no fake links). Rendered in the
// desktop sidebar and reused inside the mobile drawer (see StaffLayout) —
// pass onNavigate to close the drawer after a link is chosen.
const LIVE = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/appointments', label: 'Requests', icon: Inbox },
]

const ADMIN_LIVE = [
  { to: '/admin/services', label: 'Services', icon: SlidersHorizontal },
]

const SOON = [
  { label: 'Residents / Patients', icon: Users },
  { label: 'Consultation', icon: Stethoscope },
  { label: 'Announcements', icon: Megaphone },
  { label: 'Users', icon: KeyRound },
]

export default function StaffSidebar({ onNavigate } = {}) {
  const { sessionUser } = useStaffSession()
  const isAdmin = sessionUser?.role === 'superadmin' || sessionUser?.role === 'admin'
  const links = isAdmin ? [...LIVE, ...ADMIN_LIVE] : LIVE
  // Pending-review badge (live since TASK-015). Fails silent — no badge while
  // loading or when the counts request fails.
  const [pending, setPending] = useState(0)

  useEffect(() => {
    let active = true
    staffAppointmentList({ status: 'pending', perPage: 1 })
      .then((res) => {
        if (active) setPending(res.data.total)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return (
    <nav aria-label="Staff modules" className="flex flex-col gap-1">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 text-sm font-semibold transition-colors',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          <l.icon className="size-4 shrink-0" aria-hidden="true" />
          {l.label}
          {l.to === '/admin/appointments' && pending > 0 ? (
            <span className="ml-auto rounded-full bg-amber-400/25 px-2 py-0.5 text-[11px] font-bold" aria-label={`${pending} pending review`}>
              {pending}
            </span>
          ) : null}
        </NavLink>
      ))}
      <p className="mt-3 px-3 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
        Coming soon
      </p>
      {SOON.map((m) => (
        <span
          key={m.label}
          aria-disabled="true"
          title={`${m.label} — coming soon`}
          className="flex min-h-[44px] cursor-not-allowed items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-muted-foreground opacity-70"
        >
          <m.icon className="size-4 shrink-0" aria-hidden="true" />
          {m.label}
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold">Soon</span>
        </span>
      ))}
    </nav>
  )
}
