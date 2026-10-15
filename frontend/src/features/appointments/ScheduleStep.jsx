import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import EmptyState from '@/components/shared/EmptyState'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const monthFmt = new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' })

function toParts(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return { y, m, d }
}

// Step 2: month-grid calendar + time slots for the chosen day. Weeks start
// Monday to match the clinic template (Mon–Fri). Navigation is bounded to the
// months present in the fetched availability window.
export default function ScheduleStep({ days, selectedDate, onDate, selectedSlot, onSlot }) {
  const byDate = Object.fromEntries(days.map((d) => [d.date, d]))
  const months = [...new Set(days.map((d) => d.date.slice(0, 7)))].sort()
  // Initial month follows the auto-picked date. The parent remounts this
  // component (via key) on every fresh fetch, so no reset effect is needed
  // and manual month browsing is never interrupted mid-data.
  const [viewMonth, setViewMonth] = useState(selectedDate ? selectedDate.slice(0, 7) : months[0])
  if (months.length === 0) {
    return (
      <EmptyState
        title="No schedules published"
        body="Please check back later or contact the health center directly."
      />
    )
  }
  const shown = months.includes(viewMonth) ? viewMonth : months[0]
  const { y, m } = toParts(`${shown}-01`)
  const daysInMonth = new Date(y, m, 0).getDate()
  const leadBlanks = (new Date(y, m - 1, 1).getDay() + 6) % 7
  const prevMonth = months[months.indexOf(shown) - 1]
  const nextMonth = months[months.indexOf(shown) + 1]
  const day = byDate[selectedDate]

  return (
    <div>
      <div className="rounded-2xl border bg-card p-3 shadow-sm sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={!prevMonth}
            aria-label="Previous month"
            onClick={() => prevMonth && setViewMonth(prevMonth)}
            className="inline-flex size-11 items-center justify-center rounded-lg border transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <p className="text-sm font-bold" aria-live="polite">
            {monthFmt.format(new Date(y, m - 1, 1))}
          </p>
          <button
            type="button"
            disabled={!nextMonth}
            aria-label="Next month"
            onClick={() => nextMonth && setViewMonth(nextMonth)}
            className="inline-flex size-11 items-center justify-center rounded-lg border transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1" role="rowgroup" aria-label="Choose a date">
          {WEEKDAYS.map((w) => (
            <span key={w} className="py-1 text-center text-[11px] font-semibold text-muted-foreground" aria-hidden="true">
              {w}
            </span>
          ))}
          {Array.from({ length: leadBlanks }, (_, i) => (
            <span key={`blank-${i}`} aria-hidden="true" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const dateStr = `${shown}-${String(i + 1).padStart(2, '0')}`
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
            return (
              <button
                key={dateStr}
                type="button"
                disabled={!bookable}
                aria-pressed={active}
                aria-label={`${dateStr}${d.closed ? ', closed' : d.slots_left === 0 ? ', fully booked' : `, ${d.slots_left} slots left`}`}
                onClick={() => onDate(dateStr)}
                className={cn(
                  'flex min-h-[60px] flex-col items-center justify-center rounded-xl border-2 bg-background px-1 py-1.5 shadow-sm transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
                  active ? 'border-primary' : 'border-border hover:border-primary/60',
                )}
              >
                <span className="text-base leading-tight font-extrabold">{i + 1}</span>
                <span className={cn('text-[10px] leading-tight font-semibold', d.closed || d.slots_left === 0 ? 'text-muted-foreground' : 'text-primary')}>
                  {d.closed ? 'Closed' : d.slots_left === 0 ? 'Full' : `${d.slots_left} left`}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4" aria-live="polite">
        {!day || day.slots.length === 0 ? (
          <EmptyState
            title={day?.closed ? 'Center is closed this day' : 'No open slots this day'}
            body="Holidays and fully booked days show here. Pick another date above."
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
                {s.start_time}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
