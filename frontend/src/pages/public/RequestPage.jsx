import BookingFlow from '@/features/appointments/BookingFlow'
import Reveal from '@/components/shared/Reveal'

// Public booking portal: no account needed. Flow is service → schedule →
// details → review → confirmation (reference number + pending notice).
export default function RequestPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Reveal>
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">No account needed</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Request an appointment</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Pick a service, choose an open schedule, and leave your name and mobile number. Staff review every request.
        </p>
      </Reveal>
      <Reveal delay={0.06}>
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100" role="note">
          Online booking is for routine requests only. Emergencies go directly to the health center or the nearest
          emergency facility.
        </div>
      </Reveal>
      <Reveal delay={0.12}>
        <div className="mt-6">
          <BookingFlow />
        </div>
      </Reveal>
      <Reveal delay={0.18}>
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Your details are used only to process this request, per the Data Privacy Act of 2012. Only schedule and
          status are ever shown publicly.
        </p>
      </Reveal>
    </div>
  )
}
