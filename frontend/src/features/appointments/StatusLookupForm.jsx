import { useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FormError, TextInput } from '@/components/ui/field'
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
        <Field label="Reference number" required htmlFor={compact ? 'ref-compact' : 'ref'}>
          <TextInput
            id={compact ? 'ref-compact' : 'ref'}
            name="reference"
            autoComplete="off"
            placeholder="ACMIS-2026-000123"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            required
            className="font-mono uppercase placeholder:normal-case"
          />
        </Field>
        <Field label="Contact last 4 digits" required htmlFor={compact ? 'suffix-compact' : 'suffix'}>
          <TextInput
            id={compact ? 'suffix-compact' : 'suffix'}
            name="suffix"
            inputMode="numeric"
            maxLength={4}
            placeholder="4567"
            value={suffix}
            onChange={(e) => setSuffix(e.target.value.replace(/\D/g, '').slice(0, 4))}
            required
            className="font-mono"
          />
        </Field>
        <div className="flex items-end">
          <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
            {submitting ? 'Checking…' : 'Check'}
          </Button>
        </div>
      </form>

      <div aria-live="polite" className="mt-3">
        {state.status === 'error' ? <FormError message={state.message} /> : null}
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
