import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

// Phase 3 placeholder: full request form lands next. Keeps routing functional for the landing CTAs.
export default function RequestPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase dark:text-emerald-400">Public portal · Phase 3</p>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Request an appointment</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
        The mobile-first request form (service, date, time slot, reference number) is built next. This stub keeps the landing
        page CTAs working and uses the same mock API shape the final form will use.
      </p>
      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
        <Button asChild className="bg-emerald-700 hover:bg-emerald-700/90">
          <Link to="/status">Check status instead</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  )
}
