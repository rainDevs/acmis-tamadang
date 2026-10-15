import { Link } from 'react-router'
import { Activity, BellRing, CalendarPlus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Reveal from '@/components/shared/Reveal'

const points = [
  'Bring any valid ID and your reference number — staff find your record fast.',
  'Your visit is recorded securely and linked to the right patient file.',
  'Follow-up advice is noted so nothing gets lost after you go home.',
]

// Split section: stacked sample cards (visual) + checklist (content).
export default function CareSplit() {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2">
      <Reveal className="relative mx-auto w-full max-w-sm">
        <div aria-hidden="true">
          <div className="rotate-[-3deg] rounded-2xl border bg-card p-4 shadow-md">
            <p className="flex items-center gap-1.5 text-xs font-bold">
              <CalendarPlus className="size-4 text-emerald-600 dark:text-emerald-400" />
              Request received
            </p>
            <p className="mt-1 font-mono text-sm text-muted-foreground">ACMIS-2026-000123 · pending</p>
          </div>
          <div className="mt-3 rotate-[2deg] rounded-2xl border bg-card p-4 shadow-md">
            <p className="flex items-center gap-1.5 text-xs font-bold">
              <Activity className="size-4 text-emerald-600 dark:text-emerald-400" />
              Visit recorded
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Vitals, assessment, and advice on file.</p>
          </div>
          <div className="mt-3 rotate-[-1deg] rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-md dark:border-emerald-800 dark:bg-emerald-950">
            <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-100">
              <BellRing className="size-4 text-emerald-700 dark:text-emerald-300" />
              Follow-up noted
            </p>
            <p className="mt-1 text-sm text-emerald-900 dark:text-emerald-100">Return in 2 weeks if symptoms persist.</p>
          </div>
        </div>
      </Reveal>
      <div>
        <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase dark:text-emerald-400">Complete care</p>
        <h2 className="mt-2 text-2xl font-bold text-balance sm:text-3xl">From request to recovery, nothing falls through</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Paper notes get lost and mornings get crowded. ACMIS keeps every step — request, visit, and follow-up — tied to one
          record the staff can trust.
        </p>
        <ul className="mt-5 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-sm leading-relaxed">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white" aria-hidden="true">
                <Check className="size-3.5" />
              </span>
              {p}
            </li>
          ))}
        </ul>
        <Button asChild size="lg" className="mt-6 h-12 bg-emerald-600 px-6 text-base active:scale-[0.98] hover:bg-emerald-700">
          <Link to="/request">
            <CalendarPlus className="size-5" aria-hidden="true" />
            Request appointment
          </Link>
        </Button>
      </div>
    </div>
  )
}
