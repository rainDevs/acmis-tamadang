import { useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import StatusBadge from '@/components/shared/StatusBadge'
import { lookupAppointment } from '@/services/api'

// Public status lookup: reference_no + contact-suffix verification.
// Discloses schedule + status only — never clinical details (RULES §9).
export default function StatusLookupForm({ compact = false }) {
  const [reference, setReference] = useState('')
  const [suffix, setSuffix] = useState('')
  const [state, setState] = useState({ status: 'idle', message: '', result: null })

  const submitting = state.status === 'loading'

  async function onSubmit(e) {
    e.preventDefault()
    if (submitting) return
    setState({ status: 'loading', message: '', result: null })
    try {
      const res = await lookupAppointment(reference, suffix)
      setState({ status: 'success', message: res.message, result: res.data })
    } catch (err) {
      setState({ status: 'error', message: err.message || 'Lookup failed.', result: null })
    }
  }

  return (
    <section aria-label="Check appointment status" className={compact ? '' : 'rounded-2xl border bg-card p-5 shadow-sm sm:p-6'}>
      {!compact ? (
        <>
          <h2 className="text-base font-bold">Check your request status</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No account needed. Enter your reference number and the last 4 digits of your contact number.
            Try mock <code className="rounded bg-muted px-1 font-mono text-xs">ACMIS-2026-000123</code> + <code className="rounded bg-muted px-1 font-mono text-xs">4567</code>.
          </p>
        </>
      ) : null}

      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_auto]">
        <div>
          <label htmlFor={compact ? 'ref-compact' : 'ref'} className="mb-1 block text-xs font-semibold">
            Reference number <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input
            id={compact ? 'ref-compact' : 'ref'}
            name="reference"
            autoComplete="off"
            placeholder="ACMIS-2026-000123"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            required
            className="h-10 w-full rounded-lg border bg-background px-3 font-mono text-sm uppercase outline-none placeholder:normal-case focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor={compact ? 'suffix-compact' : 'suffix'} className="mb-1 block text-xs font-semibold">
            Contact last 4 digits <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input
            id={compact ? 'suffix-compact' : 'suffix'}
            name="suffix"
            inputMode="numeric"
            maxLength={4}
            placeholder="4567"
            value={suffix}
            onChange={(e) => setSuffix(e.target.value.replace(/\D/g, '').slice(0, 4))}
            required
            className="h-10 w-full rounded-lg border bg-background px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={submitting} className="w-full bg-emerald-700 hover:bg-emerald-700/90 sm:w-auto">
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
            {submitting ? 'Checking…' : 'Check'}
          </Button>
        </div>
      </form>

      <div aria-live="polite" className="mt-3">
        {state.status === 'error' ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
            {state.message}
          </p>
        ) : null}
        {state.status === 'success' && state.result ? (
          <div className="rounded-lg border bg-muted/50 px-3 py-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono font-semibold">{state.result.reference_no}</span>
              <StatusBadge status={state.result.status} />
            </div>
            <p className="mt-1 text-muted-foreground">
              {state.result.service_name} · {state.result.schedule_date} · {state.result.start_time}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Only status and schedule are shown publicly to protect your privacy.</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
