import StatusLookupForm from '@/features/appointments/StatusLookupForm'

export default function StatusPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase dark:text-emerald-400">No account needed</p>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Check request status</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
        Only schedule and status are shown publicly. For corrections, contact the health center directly.
      </p>
      <div className="mt-6">
        <StatusLookupForm />
      </div>
    </div>
  )
}
