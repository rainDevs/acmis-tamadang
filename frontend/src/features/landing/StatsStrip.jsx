import { CalendarCheck, Hash, ListChecks, UserX } from 'lucide-react'

// Honest numbers only: live service count + workflow facts. No invented statistics.
export default function StatsStrip({ serviceCount }) {
  const stats = [
    { icon: ListChecks, value: serviceCount == null ? '–' : String(serviceCount), label: 'Bookable services' },
    { icon: CalendarCheck, value: '3', label: 'Steps to a visit' },
    { icon: Hash, value: '1', label: 'Reference per request' },
    { icon: UserX, value: '0', label: 'Accounts needed' },
  ]
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
          <span className="order-1 flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-300" aria-hidden="true">
            <s.icon className="size-5" />
          </span>
          <dt className="order-3 text-xs leading-snug text-muted-foreground">{s.label}</dt>
          <dd className="order-2 text-2xl font-extrabold text-slate-900 dark:text-white">{s.value}</dd>
        </div>
      ))}
    </dl>
  )
}
