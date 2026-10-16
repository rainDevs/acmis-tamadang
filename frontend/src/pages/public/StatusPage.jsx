import StatusLookupForm from '@/features/appointments/StatusLookupForm'
import Reveal from '@/components/shared/Reveal'

export default function StatusPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Reveal>
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">No account needed</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Check request status</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Only schedule and status are shown publicly. For corrections, contact the health center directly.
        </p>
      </Reveal>
      <Reveal delay={0.06}>
        <div className="mt-6">
          <StatusLookupForm />
        </div>
      </Reveal>
    </div>
  )
}
