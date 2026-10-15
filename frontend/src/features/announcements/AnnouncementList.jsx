import { useEffect, useState } from 'react'
import { Loader2, Megaphone, Pin } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { getAnnouncements } from '@/services/api'
import { cn } from '@/lib/utils'

const typeStyles = {
  schedule: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-100',
  holiday: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
  reminder: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
  notice: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
}

const typeLabels = {
  schedule: 'Schedule',
  holiday: 'Holiday',
  reminder: 'Reminder',
  notice: 'Notice',
}

function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Community bulletin board: pinned items first, full loading/error/empty states.
export default function AnnouncementList() {
  const [items, setItems] = useState([])
  const [state, setState] = useState('loading')
  const reduce = useReducedMotion()

  useEffect(() => {
    let active = true
    getAnnouncements()
      .then((res) => {
        if (active) {
          setItems(res.data)
          setState('ready')
        }
      })
      .catch(() => {
        if (active) setState('error')
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div aria-live="polite">
      {state === 'loading' ? (
        <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading announcements…
        </p>
      ) : state === 'error' ? (
        <p role="alert" className="mx-auto max-w-md rounded-xl border bg-card px-4 py-3 text-center text-sm">
          Could not load announcements right now. Please try again later.
        </p>
      ) : items.length === 0 ? (
        <p className="mx-auto max-w-md rounded-xl border bg-card px-4 py-3 text-center text-sm text-muted-foreground">
          No announcements at the moment.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {items.map((a, i) => (
            <motion.li
              key={a.id}
              className={cn(
                'list-none rounded-2xl border bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md',
                a.pinned && 'border-emerald-300 ring-1 ring-emerald-200',
              )}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-64px' }}
              transition={{ duration: 0.45, delay: (i % 2) * 0.06, ease: 'easeOut' }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', typeStyles[a.type] || typeStyles.notice)}>
                  {typeLabels[a.type] || a.type}
                </span>
                {a.pinned ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    <Pin className="size-3.5" aria-hidden="true" /> Pinned
                  </span>
                ) : null}
                <time dateTime={a.date} className="ml-auto text-xs text-muted-foreground">
                  {formatDate(a.date)}
                </time>
              </div>
              <h3 className="mt-2.5 flex items-start gap-2 text-base font-bold">
                <Megaphone className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                {a.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  )
}
