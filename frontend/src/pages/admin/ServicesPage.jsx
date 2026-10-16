import { useEffect, useState } from 'react'
import { CalendarOff, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/field'
import { Modal } from '@/components/ui/dialog'
import EmptyState from '@/components/shared/EmptyState'
import LoadingState from '@/components/shared/LoadingState'
import Reveal from '@/components/shared/Reveal'
import { useStaffSession } from '@/features/staff/useStaffSession'
import {
  adminAddClosure,
  adminClosuresList,
  adminDeleteClosure,
  adminSchedulesList,
  adminServicesList,
  adminUpdateSchedule,
  adminUpdateService,
} from '@/services/api'


const DAY_NAMES = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' }

// Scheduling master-data administration (TASK-020, admin+ only).
// Services: description/duration/active (names stay the approved catalog).
// Schedules: window/duration/capacity/active (structure stays fixed).
// Closures: add/remove operational dates.
export default function ServicesPage() {
  const { sessionUser } = useStaffSession()
  const isAdmin = sessionUser?.role === 'superadmin' || sessionUser?.role === 'admin'
  const [services, setServices] = useState([])
  const [schedules, setSchedules] = useState([])
  const [closures, setClosures] = useState([])
  const [state, setState] = useState('loading')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // { kind: 'service'|'schedule', row }
  const [draft, setDraft] = useState({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [closureDate, setClosureDate] = useState('')
  const [closureReason, setClosureReason] = useState('')
  const [closureError, setClosureError] = useState('')
  const [closingDate, setClosingDate] = useState(false)
  const [deleting, setDeleting] = useState(null) // closure row pending confirm
  const [deletingWorking, setDeletingWorking] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (!isAdmin) return
    let active = true
    ;(async () => {
      try {
        const [s, c, l] = await Promise.all([adminServicesList(), adminSchedulesList(), adminClosuresList()])
        if (!active) return
        setServices(s.data.services)
        setSchedules(c.data.schedules)
        setClosures(l.data.closures)
        setState('ready')
      } catch (err) {
        if (!active) return
        setState('error')
        setError(err.message || 'Could not load scheduling data.')
      }
    })()
    return () => {
      active = false
    }
  }, [isAdmin, reloadToken])

  function reload() {
    setState('loading')
    setError('')
    setReloadToken((t) => t + 1)
  }

  function openEdit(kind, row) {
    setEditing({ kind, row })
    setDraft(
      kind === 'service'
        ? { description: row.description || '', duration_minutes: String(row.duration_minutes), is_active: row.is_active }
        : {
            start_time: row.start_time,
            end_time: row.end_time,
            slot_duration_minutes: String(row.slot_duration_minutes),
            capacity_per_slot: String(row.capacity_per_slot),
            is_active: row.is_active,
          },
    )
    setSaveError('')
  }

  async function saveEdit() {
    if (saving || !editing) return
    setSaving(true)
    setSaveError('')
    try {
      if (editing.kind === 'service') {
        const res = await adminUpdateService(editing.row.id, {
          description: draft.description,
          duration_minutes: Number(draft.duration_minutes),
          is_active: draft.is_active,
        })
        setServices((prev) => prev.map((s) => (s.id === res.data.id ? res.data : s)))
      } else {
        const res = await adminUpdateSchedule(editing.row.id, {
          start_time: draft.start_time,
          end_time: draft.end_time,
          slot_duration_minutes: Number(draft.slot_duration_minutes),
          capacity_per_slot: Number(draft.capacity_per_slot),
          is_active: draft.is_active,
        })
        setSchedules((prev) => prev.map((s) => (s.id === res.data.id ? res.data : s)))
      }
      setEditing(null)
    } catch (err) {
      setSaveError(err.message || 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function addClosure(e) {
    e.preventDefault()
    if (closingDate) return
    setClosingDate(true)
    setClosureError('')
    try {
      const res = await adminAddClosure({ closure_date: closureDate, reason: closureReason.trim() })
      setClosures((prev) => [...prev, res.data].sort((a, b) => b.closure_date.localeCompare(a.closure_date)))
      setClosureDate('')
      setClosureReason('')
    } catch (err) {
      setClosureError(err.message || 'Could not add this closure.')
    } finally {
      setClosingDate(false)
    }
  }

  async function confirmDelete() {
    if (deletingWorking || !deleting) return
    setDeletingWorking(true)
    try {
      await adminDeleteClosure(deleting.id)
      setClosures((prev) => prev.filter((c) => c.id !== deleting.id))
      setDeleting(null)
    } catch (err) {
      setClosureError(err.message || 'Could not remove this closure.')
      setDeleting(null)
    } finally {
      setDeletingWorking(false)
    }
  }

  return (
    <div>
      <Reveal>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Services & schedules</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Manage the scheduling master data. Changes apply to future bookings — existing requests are untouched.
        </p>
      </Reveal>

      {state === 'loading' ? (
        <div className="mt-5">
          <LoadingState message="Loading scheduling data…" />
        </div>
      ) : !isAdmin ? (
        <div className="mt-5">
          <EmptyState
            title="Admin access needed"
            body="Your staff account can view requests. Managing services and schedules needs an admin account."
          />
        </div>
      ) : state === 'error' ? (
        <div className="mt-5">
          <EmptyState
            title="Could not load scheduling data"
            body={error}
            action={
              <Button type="button" variant="outline" onClick={reload}>
                Try again
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <Reveal delay={0.06}>
            <section className="mt-5 rounded-2xl border bg-card p-5 shadow-sm" aria-label="Services">
              <h2 className="text-base font-bold">Services</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Names follow the approved catalog and can&apos;t be renamed here.
              </p>
              <ul className="mt-3 grid gap-2.5">
                {services.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 rounded-xl border px-3.5 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{s.name}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {s.duration_minutes} min · {s.is_active ? 'Active' : 'Hidden from booking'}
                      </span>
                    </span>
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit('service', s)} aria-label={`Edit ${s.name}`}>
                      <Pencil className="size-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>

          <Reveal delay={0.1}>
            <section className="mt-4 rounded-2xl border bg-card p-5 shadow-sm" aria-label="Weekly schedule">
              <h2 className="text-base font-bold">Weekly schedule</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Template rows apply to all services. Day assignments stay fixed; adjust windows, slot length, capacity, or visibility.
              </p>
              <ul className="mt-3 grid gap-2.5">
                {schedules.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 rounded-xl border px-3.5 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{DAY_NAMES[c.day_of_week] || `Day ${c.day_of_week}`}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {c.start_time}–{c.end_time} · {c.slot_duration_minutes} min · {c.capacity_per_slot}/slot · {c.is_active ? 'Open' : 'Closed'}
                      </span>
                    </span>
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit('schedule', c)} aria-label={`Edit ${DAY_NAMES[c.day_of_week] || 'schedule'} hours`}>
                      <Pencil className="size-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>

          <Reveal delay={0.14}>
            <section className="mt-4 rounded-2xl border bg-card p-5 shadow-sm" aria-label="Holiday closures">
              <h2 className="text-base font-bold">Holiday closures</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Closed dates offer no slots. Past dates stay listed for the record.
              </p>
              <form onSubmit={addClosure} className="mt-3 grid gap-2.5 sm:grid-cols-[160px_1fr_auto]">
                <Field label="Closure date" required htmlFor="closure-date">
                  <TextInput
                    id="closure-date"
                    type="date"
                    value={closureDate}
                    onChange={(e) => setClosureDate(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Reason (optional)" htmlFor="closure-reason">
                  <TextInput
                    id="closure-reason"
                    value={closureReason}
                    onChange={(e) => setClosureReason(e.target.value)}
                    placeholder="e.g. Christmas Day"
                    maxLength={255}
                  />
                </Field>
                <div className="flex items-end">
                  <Button type="submit" size="lg" disabled={closingDate} className="w-full sm:w-auto">
                    {closingDate ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                    {closingDate ? 'Adding…' : 'Add'}
                  </Button>
                </div>
              </form>
              {closureError ? (
                <p role="alert" className="mt-2 text-xs font-medium text-destructive">{closureError}</p>
              ) : null}
              {closures.length === 0 ? (
                <p className="mt-3 rounded-xl bg-muted/60 px-4 py-3 text-center text-xs text-muted-foreground">
                  No closures recorded.
                </p>
              ) : (
                <ul className="mt-3 grid gap-2.5">
                  {closures.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 rounded-xl border px-3.5 py-3">
                      <CalendarOff className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">{c.closure_date}</span>
                        {c.reason ? <span className="block truncate text-xs text-muted-foreground">{c.reason}</span> : null}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleting(c)}
                        aria-label={`Remove closure on ${c.closure_date}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Remove</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </Reveal>
        </>
      )}

      <Modal
        open={editing !== null}
        onOpenChange={(v) => !v && !saving && setEditing(null)}
        labelledBy="services-edit-title"
      >
        <h2 id="services-edit-title" className="pr-8 text-base font-bold">
          Edit {editing?.kind === 'service' ? editing.row.name : `${DAY_NAMES[editing?.row.day_of_week] || ''} hours`}
        </h2>
        {editing?.kind === 'service' ? (
          <div className="mt-3 grid gap-3">
            <Field label="Description" htmlFor="svc-description">
              <TextInput
                id="svc-description"
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                maxLength={255}
                placeholder="Short public description"
              />
            </Field>
            <Field label="Slot duration (minutes)" required htmlFor="svc-duration">
              <TextInput
                id="svc-duration"
                type="number"
                min={5}
                max={480}
                value={draft.duration_minutes}
                onChange={(e) => setDraft((d) => ({ ...d, duration_minutes: e.target.value }))}
                required
              />
            </Field>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm font-medium">
              <input
                type="checkbox"
                checked={Boolean(draft.is_active)}
                onChange={(e) => setDraft((d) => ({ ...d, is_active: e.target.checked }))}
                className="size-5 accent-emerald-600"
              />
              Offered for booking
            </label>
          </div>
        ) : editing ? (
          <div className="mt-3 grid gap-3">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Opens" required htmlFor="sch-start">
                <TextInput
                  id="sch-start"
                  type="time"
                  value={draft.start_time}
                  onChange={(e) => setDraft((d) => ({ ...d, start_time: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Closes" required htmlFor="sch-end">
                <TextInput
                  id="sch-end"
                  type="time"
                  value={draft.end_time}
                  onChange={(e) => setDraft((d) => ({ ...d, end_time: e.target.value }))}
                  required
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Slot (minutes)" required htmlFor="sch-duration">
                <TextInput
                  id="sch-duration"
                  type="number"
                  min={5}
                  max={480}
                  value={draft.slot_duration_minutes}
                  onChange={(e) => setDraft((d) => ({ ...d, slot_duration_minutes: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Per slot" required htmlFor="sch-capacity">
                <TextInput
                  id="sch-capacity"
                  type="number"
                  min={1}
                  max={50}
                  value={draft.capacity_per_slot}
                  onChange={(e) => setDraft((d) => ({ ...d, capacity_per_slot: e.target.value }))}
                  required
                />
              </Field>
            </div>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm font-medium">
              <input
                type="checkbox"
                checked={Boolean(draft.is_active)}
                onChange={(e) => setDraft((d) => ({ ...d, is_active: e.target.checked }))}
                className="size-5 accent-emerald-600"
              />
              Open for booking
            </label>
          </div>
        ) : null}
        {saveError ? (
          <p role="alert" className="mt-3 text-xs font-medium text-destructive">{saveError}</p>
        ) : null}
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <Button type="button" variant="outline" size="lg" onClick={() => !saving && setEditing(null)} disabled={saving} className="sm:flex-1">
            Cancel
          </Button>
          <Button type="button" size="lg" onClick={saveEdit} disabled={saving} className="sm:flex-1">
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Saving…
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </Modal>

      <Modal
        open={deleting !== null}
        onOpenChange={(v) => !v && !deletingWorking && setDeleting(null)}
        labelledBy="closure-delete-title"
      >
        <h2 id="closure-delete-title" className="pr-8 text-base font-bold">
          Reopen {deleting?.closure_date}?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That date offers slots again. Existing requests are unaffected.
        </p>
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <Button type="button" variant="outline" size="lg" onClick={() => !deletingWorking && setDeleting(null)} disabled={deletingWorking} className="sm:flex-1">
            Keep closed
          </Button>
          <Button type="button" size="lg" onClick={confirmDelete} disabled={deletingWorking} className="sm:flex-1">
            {deletingWorking ? (
              <>
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Removing…
              </>
            ) : (
              'Remove closure'
            )}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
