import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/field'
import { Modal } from '@/components/ui/dialog'
import EmptyState from '@/components/shared/EmptyState'
import LoadingState from '@/components/shared/LoadingState'
import StatusBadge from '@/components/shared/StatusBadge'
import { toAmPm } from '@/lib/time'
import { useStaffSession } from './useStaffSession'
import { staffAppointmentDetail, staffUpdateStatus } from '@/services/api'
import { ACTION_LABELS, NEXT_ACTIONS } from './reviewMeta'

// Live staff detail (TASK-015). The record loads from
// GET /api/appointments/{reference}; actions PATCH the status endpoint.
// Transition buttons only gate rendering — the API enforces transitions,
// reasons, and the superadmin/admin review role server-side.
export default function AppointmentDetail({ referenceNo }) {
  const { sessionUser } = useStaffSession()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [action, setAction] = useState(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [working, setWorking] = useState(false)
  const [notice, setNotice] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await staffAppointmentDetail(referenceNo)
        if (active) {
          setRecord(res.data)
          setError('')
        }
      } catch (err) {
        if (active) setError(err.status === 404 ? 'not-found' : (err.message || 'Could not load this request.'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [referenceNo, reloadToken])

  function reload() {
    setRecord(null)
    setError('')
    setNotice('')
    setLoading(true)
    setReloadToken((t) => t + 1)
  }

  if (loading) {
    return (
      <div>
        <p>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/appointments">
              <ArrowLeft className="size-4" aria-hidden="true" /> All requests
            </Link>
          </Button>
        </p>
        <div className="mt-4">
          <LoadingState message="Loading request…" />
        </div>
      </div>
    )
  }

  if (error === 'not-found' || (!error && !record)) {
    return (
      <EmptyState
        title="Request not found"
        body="It may have been removed, or the reference is mistyped."
        action={
          <Button asChild variant="outline">
            <Link to="/admin/appointments">Back to requests</Link>
          </Button>
        }
      />
    )
  }

  if (error) {
    return (
      <EmptyState
        title="Could not load this request"
        body={error}
        action={
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button type="button" variant="outline" onClick={reload}>
              Try again
            </Button>
            <Button asChild variant="ghost">
              <Link to="/admin/appointments">Back to requests</Link>
            </Button>
          </div>
        }
      />
    )
  }

  const actions = NEXT_ACTIONS[record.status] ?? []
  const needsReason = action === 'rejected' || action === 'cancelled'
  // Owner-approved review rule: UI-only gate (fail closed); the API enforces it.
  const canReview = sessionUser?.role === 'superadmin' || sessionUser?.role === 'admin'

  function startAction(status) {
    setAction(status)
    setReason('')
    setReasonError('')
    setNotice('')
  }

  async function confirmAction() {
    if (working) return
    if (needsReason && !reason.trim()) {
      setReasonError('A short reason is required so the resident can be informed.')
      return
    }
    setWorking(true)
    try {
      const res = await staffUpdateStatus(referenceNo, { status: action, reason: reason.trim() })
      setRecord(res.data)
      setAction(null)
      setNotice(`Status set to ${res.data.status.replace('_', ' ')}.`)
    } catch (err) {
      if (needsReason && err.status === 422 && !reason.trim()) {
        setReasonError('A short reason is required so the resident can be informed.')
      } else {
        setReasonError('')
        setNotice(err.message || 'Could not update the status. Please try again.')
      }
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="grid gap-4">
      <p>
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/appointments">
            <ArrowLeft className="size-4" aria-hidden="true" /> All requests
          </Link>
        </Button>
      </p>

      <section className="rounded-2xl border bg-card p-5 shadow-sm" aria-label="Request details">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-base font-bold">{record.reference_no}</p>
          <StatusBadge status={record.status} />
        </div>
        <dl className="mt-4 grid gap-2.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Service</dt>
            <dd className="text-right font-semibold">{record.service_name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Schedule</dt>
            <dd className="font-semibold">
              {record.appointment_date} · {toAmPm(record.start_time)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Resident</dt>
            <dd className="text-right font-semibold">{record.requester_name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Contact</dt>
            <dd className="font-mono font-semibold">{record.contact_number}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Address</dt>
            <dd className="text-right font-semibold">{record.address}</dd>
          </div>
        </dl>
      </section>

      {actions.length > 0 ? (
        canReview ? (
          <section className="rounded-2xl border bg-card p-5 shadow-sm" aria-label="Staff actions">
            <h2 className="text-sm font-bold">Review this request</h2>
            <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              {actions.map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="lg"
                  variant={s === 'approved' || s === 'completed' ? 'default' : 'outline'}
                  onClick={() => startAction(s)}
                  className="sm:flex-1"
                >
                  {ACTION_LABELS[s] ?? s}
                </Button>
              ))}
            </div>
          </section>
        ) : (
          <p className="rounded-xl bg-muted/60 px-4 py-3 text-center text-xs text-muted-foreground">
            Your staff account can view this request. Approving or rejecting needs an admin account.
          </p>
        )
      ) : (
        <p className="rounded-xl bg-muted/60 px-4 py-3 text-center text-xs text-muted-foreground">
          No further actions — a {record.status.replace('_', ' ')} request is final in this workflow.
        </p>
      )}

      {notice ? (
        <p role="status" className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
          {notice}
        </p>
      ) : null}

      <section className="rounded-2xl border bg-card p-5 shadow-sm" aria-label="Status history">
        <h2 className="text-sm font-bold">History</h2>
        {record.history.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No staff actions yet — submitted {record.created_at}.
          </p>
        ) : (
          <ol className="mt-3 grid gap-0">
            {record.history.map((h, i) => (
              <li key={`${h.status}-${h.at}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
                <span aria-hidden="true" className="flex flex-col items-center">
                  <span className="mt-1 size-2.5 rounded-full bg-primary" />
                  {i < record.history.length - 1 ? <span className="w-px flex-1 bg-border" /> : null}
                </span>
                <div className="min-w-0 text-sm">
                  <p className="font-semibold capitalize">{h.status.replace('_', ' ')}</p>
                  <p className="text-xs text-muted-foreground">
                    {h.at} · {h.actor}
                  </p>
                  {h.note ? <p className="mt-0.5 text-xs">{h.note}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <Modal
        open={action !== null}
        onOpenChange={(v) => !v && !working && setAction(null)}
        labelledBy="staff-action-title"
      >
        <h2 id="staff-action-title" className="pr-8 text-base font-bold">
          {action ? ACTION_LABELS[action] : ''} — {record.reference_no}?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {action === 'approved'
            ? 'The resident can be told to come on schedule. Capacity for this slot is now taken.'
            : action === 'rejected'
              ? 'The resident keeps the reference but must submit a new request.'
              : 'This updates the request timeline accordingly.'}
        </p>
        {needsReason ? (
          <div className="mt-3">
            <Field label="Reason (shared with resident)" required htmlFor="action-reason" error={reasonError}>
              <TextInput
                id="action-reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                  setReasonError('')
                }}
                invalid={Boolean(reasonError)}
                placeholder="e.g. Duplicate of ACMIS-2026-000201"
              />
            </Field>
          </div>
        ) : null}
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <Button type="button" variant="outline" size="lg" onClick={() => !working && setAction(null)} disabled={working} className="sm:flex-1">
            Keep as is
          </Button>
          <Button type="button" size="lg" onClick={confirmAction} disabled={working} className="sm:flex-1">
            {working ? (
              <>
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Saving…
              </>
            ) : (
              `Confirm ${action ? (ACTION_LABELS[action] ?? action).toLowerCase() : ''}`
            )}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
