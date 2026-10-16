import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import EmptyState from '@/components/shared/EmptyState'
import LoadingState from '@/components/shared/LoadingState'
import StatusBadge from '@/components/shared/StatusBadge'
import Reveal from '@/components/shared/Reveal'
import { toAmPm } from '@/lib/time'
import { staffAppointmentList } from '@/services/api'

// Staff overview (live since TASK-015). Module navigation lives in the
// sidebar; this page answers "what needs me right now".
export default function DashboardPage() {
  const [pending, setPending] = useState([])
  const [counts, setCounts] = useState({ pending: 0, approved: 0, all: 0 })
  const [state, setState] = useState('loading')

  useEffect(() => {
    let active = true
    staffAppointmentList({ status: 'pending', perPage: 5 })
      .then((res) => {
        if (!active) return
        setPending(res.data.rows)
        setCounts(res.data.counts)
        setState('ready')
      })
      .catch(() => {
        if (active) setState('error')
      })
    return () => {
      active = false
    }
  }, [])

  const stats = [
    { label: 'Needs review', value: counts.pending ?? 0, tone: 'text-amber-600 dark:text-amber-400' },
    { label: 'Approved upcoming', value: counts.approved ?? 0, tone: 'text-primary' },
    { label: 'Total requests', value: counts.all ?? 0, tone: 'text-foreground' },
  ]

  return (
    <div>
      <Reveal>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Staff dashboard</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Daily operations at a glance. Pick a module in the sidebar for the full workflow.
        </p>
      </Reveal>

      <Reveal delay={0.06}>
        <dl className="mt-5 grid grid-cols-3 gap-2.5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border bg-card p-4 text-center shadow-sm">
              <dd className={`text-2xl font-extrabold sm:text-3xl ${s.tone}`}>
                {state === 'loading' ? '–' : s.value}
              </dd>
              <dt className="mt-1 text-[11px] leading-snug font-medium text-muted-foreground sm:text-xs">{s.label}</dt>
            </div>
          ))}
        </dl>
      </Reveal>

      <Reveal delay={0.12}>
        <section className="mt-5" aria-label="Requests needing review">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold">Needs review</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/appointments">
                All requests <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          {state === 'loading' ? (
            <div className="mt-3">
              <LoadingState message="Loading requests…" />
            </div>
          ) : state === 'error' ? (
            <div className="mt-3">
              <EmptyState
                title="Could not load requests"
                body="Check your connection and try again."
                action={
                  <Button type="button" variant="outline" onClick={() => window.location.reload()}>
                    Reload
                  </Button>
                }
              />
            </div>
          ) : pending.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="Queue is clear" body="No pending requests right now." />
            </div>
          ) : (
            <ul className="mt-3 grid gap-2.5">
              {pending.slice(0, 5).map((a) => (
                <li key={a.reference_no}>
                  <Link
                    to={`/admin/appointments/${a.reference_no}`}
                    className="block rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-sm font-bold">{a.reference_no}</span>
                      <StatusBadge status={a.status} />
                    </span>
                    <span className="mt-1 block text-sm font-semibold">{a.requester_name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {a.service_name} · {a.appointment_date} · {toAmPm(a.start_time)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Reveal>
    </div>
  )
}
