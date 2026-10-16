import { useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { toAmPm } from '@/lib/time'
import EmptyState from '@/components/shared/EmptyState'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthFmt = new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' })

function toParts(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return { y, m, d }
}

function toISO(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addMonth(monthKey, delta) {
  const { y, m } = toParts(`${monthKey}-01`)
  const dt = new Date(y, m - 1 + delta, 1)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}

// Step 2: month-grid calendar + time slots for the chosen day. Weeks start
// Monday to match the clinic template (Mon–Fri). Navigation is bounded to the
// months present in the fetched availability window.
export default function ScheduleStep({ days, selectedDate, onDate, selectedSlot, onSlot, onMonthChange, loadingMonth }) {
  const byDate = Object.fromEntries(days.map((d) => [d.date, d]))
  const [todayKey] = useState(() => toISO(new Date()).slice(0, 7))
  const currentKey = todayKey
  // Initial month follows the auto-picked date. The parent remounts this
  // component (via key) on every fresh service load, so no reset effect is
  // needed and manual month browsing is never interrupted mid-data.
  const [viewMonth, setViewMonth] = useState(selectedDate ? selectedDate.slice(0, 7) : currentKey)
  // Month-slide direction for the grid transition. Enter-only (no exit wait)
  // so paging stays snappy; instant swap under reduced motion.
  const reduce = useReducedMotion()
  const [dir, setDir] = useState(0)
  // Navigation is unbounded into the future: months without data yet render
  // as placeholders and trigger a fetch. Past months stay off-limits.
  function goMonth(key) {
    setDir(key > viewMonth ? 1 : -1)
    onMonthChange(key)
    setViewMonth(key)
  }
  const prevKey = addMonth(viewMonth, -1)
  const nextKey = addMonth(viewMonth, 1)
  const canPrev = viewMonth > currentKey
  const { y, m } = toParts(`${viewMonth}-01`)
  const daysInMonth = new Date(y, m, 0).getDate()
  // Weeks start Sunday (getDay(): 0=Sun). Template data is unaffected —
  // availability is looked up by date, not by column position.
  const leadBlanks = new Date(y, m - 1, 1).getDay()
  const day = byDate[selectedDate]

  return (
    <div>
      <div className="rounded-2xl border bg-card p-3 shadow-sm sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={!canPrev}
            aria-label="Previous month"
            onClick={() => goMonth(prevKey)}
            className="inline-flex size-11 items-center justify-center rounded-lg border transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <p className="flex items-center gap-2 text-sm font-bold" aria-live="polite">
            {monthFmt.format(new Date(y, m - 1, 1))}
            {loadingMonth ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
          </p>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => goMonth(nextKey)}
            className="inline-flex size-11 items-center justify-center rounded-lg border transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>

        <motion.div
          key={viewMonth}
          role="rowgroup"
          aria-label="Choose a date"
          className="mt-2 grid grid-cols-7 gap-1"
          initial={reduce || dir === 0 ? false : { opacity: 0, x: 28 * dir }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {WEEKDAYS.map((w) => (
            <span key={w} className="py-1 text-center text-[11px] font-semibold text-muted-foreground" aria-hidden="true">
              {w}
            </span>
          ))}
          {Array.from({ length: leadBlanks }, (_, i) => (
            <span key={`blank-${i}`} aria-hidden="true" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const dateStr = `${viewMonth}-${String(i + 1).padStart(2, '0')}`
            const d = byDate[dateStr]
            if (!d) {
              return (
                <span
                  key={dateStr}
                  className="flex min-h-[60px] items-center justify-center rounded-xl text-sm text-muted-foreground/40"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
              )
            }
            const active = dateStr === selectedDate
            const bookable = !d.closed && d.slots_left > 0
            // No template coverage (e.g. weekends) means the clinic holds no
            // hours that day — label it Closed, not Full. Full is reserved
            // for days where slots existed but all are taken.
            const noHours = d.closed || d.slots.length === 0
            return (
              <button
                key={dateStr}
                type="button"
                disabled={!bookable}
                aria-pressed={active}
                aria-label={`${dateStr}${noHours ? ', closed' : d.slots_left === 0 ? ', fully booked' : `, ${d.slots_left} slots left`}`}
                onClick={() => onDate(dateStr)}
                className={cn(
                  'flex min-h-[60px] flex-col items-center justify-center rounded-xl border-2 bg-background px-1 py-1.5 shadow-sm transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
                  active ? 'border-primary' : 'border-border hover:border-primary/60',
                )}
              >
                <span className="text-base leading-tight font-extrabold">{i + 1}</span>
                <span className={cn('text-[10px] leading-tight font-semibold', noHours || d.slots_left === 0 ? 'text-muted-foreground' : 'text-primary')}>
                  {noHours ? 'Closed' : d.slots_left === 0 ? 'Full' : `${d.slots_left} left`}
                </span>
              </button>
            )
          })}
        </motion.div>
      </div>

      <div className="mt-4" aria-live="polite">
        {!day || day.slots.length === 0 ? (
          <EmptyState
            title="Center is closed this day"
            body="The clinic holds no hours on this date — holidays and weekends included. Pick another date above."
          />
        ) : day.slots_left === 0 ? (
          <EmptyState
            title="No open slots this day"
            body="Every slot is taken. Pick another date above."
          />
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label="Time slots">
            {day.slots.map((s) => (
              <button
                key={s.start_time}
                type="button"
                disabled={!s.is_available}
                aria-pressed={selectedSlot === s.start_time}
                onClick={() => onSlot(s.start_time)}
                className={cn(
                  'min-h-[44px] rounded-xl border bg-card px-2 py-2 font-mono text-sm font-semibold shadow-sm transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40 disabled:line-through',
                  selectedSlot === s.start_time ? 'border-primary ring-1 ring-ring' : 'hover:border-primary',
                )}
              >
                {toAmPm(s.start_time)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
