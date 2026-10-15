import { ClipboardCheck, Stethoscope, UserCog } from 'lucide-react'
import Reveal from '@/components/shared/Reveal'

// Sample role scopes from the development plan. Final permissions are
// confirmed with the health center — stated openly, not presented as final.
const roles = [
  {
    icon: UserCog,
    title: 'Administrator',
    scope: 'Staff accounts and authorized system settings.',
  },
  {
    icon: ClipboardCheck,
    title: 'Health Worker',
    scope: 'Resident records and appointment workflows.',
  },
  {
    icon: Stethoscope,
    title: 'Authorized Clinician',
    scope: 'Consultation records within assigned permissions.',
  },
]

const values = [
  { title: 'Phone-friendly', text: 'One-column forms with large touch targets for older phones and slow connections.' },
  { title: 'Private by default', text: 'Status lookup shows schedule + status only. No diagnoses or notes are ever exposed publicly.' },
  { title: 'Staff-confirmed', text: 'A request is not an approval. Staff confirm capacity to prevent overbooking.' },
]

export default function RolesSplit() {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <div>
        <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase dark:text-emerald-400">Who assists you</p>
        <h2 className="mt-2 text-2xl font-bold text-balance sm:text-3xl">The right person for every step</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Sample roles from the project plan — final permissions are confirmed with the health center.
        </p>
        <div role="list" className="mt-5 space-y-3">
          {roles.map((r, i) => (
            <Reveal key={r.title} delay={i * 0.06}>
              <div role="listitem" className="flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-sm">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white" aria-hidden="true">
                  <r.icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold">{r.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{r.scope}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-slate-900 p-6 text-slate-200 sm:p-8 dark:border dark:border-white/10">
        <p className="text-xs font-semibold tracking-widest text-emerald-300 uppercase">Our clinic values</p>
        <h2 className="mt-2 text-2xl font-bold text-balance text-white sm:text-3xl">Calm, private, and confirmed</h2>
        <ul className="mt-5 space-y-4">
          {values.map((v) => (
            <li key={v.title}>
              <h3 className="text-sm font-bold text-white">{v.title}</h3>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{v.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
