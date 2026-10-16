import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/field'
import EmptyState from '@/components/shared/EmptyState'
import LoadingState from '@/components/shared/LoadingState'
import StatusBadge from '@/components/shared/StatusBadge'
import { toAmPm } from '@/lib/time'
import { staffAppointmentList } from '@/services/api'
import { STAFF_STATUSES } from './reviewMeta'
import { cn } from '@/lib/utils'

const PER_PAGE = 5

// Live staff queue (TASK-015). Filters + pagination run server-side; the
// chips show server counts and the pager follows the server page totals.
export default function AppointmentList() {
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState([])
  const [counts, setCounts] = useState({ all: 0 })
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const mounted = useRef(false)
  const requestId = useRef(0)

  const fetchRows = useCallback(async (overrides = {}) => {
    const next = { status, q: query, page, ...overrides }
    const id = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const res = await staffAppointmentList({ ...next, perPage: PER_PAGE })
      if (requestId.current !== id) return // a newer request already won
      setRows(res.data.rows)
      setCounts(res.data.counts)
      setPages(res.data.pages)
      setTotal(res.data.total)
      setPage(res.data.page)
    } catch (err) {
      if (requestId.current !== id) return
      setError(err.message || 'Could not load requests. Please try again.')
    } finally {
      if (requestId.current === id) setLoading(false)
    }
  }, [status, query, page])

  // Debounce the search box so typing doesn't fire a request per keystroke.
  // Skipped on mount — the fetch below already loads the first page.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    const t = setTimeout(() => {
      fetchRows({ q: query, page: 1 })
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  useEffect(() => {
    fetchRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page])

  function pickStatus(s) {
    setStatus(s)
    setPage(1)
  }

  function search(value) {
    setQuery(value)
    setPage(1)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
        {['all', ...STAFF_STATUSES].map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={status === s}
            onClick={() => pickStatus(s)}
            className={cn(
              'min-h-[44px] rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              status === s ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary',
            )}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')} · {counts[s] ?? 0}
          </button>
        ))}
      </div>

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <TextInput
          aria-label="Search by reference number or name"
          placeholder="Search reference or name…"
          value={query}
          onChange={(e) => search(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="mt-4" aria-live="polite">
        {loading ? (
          <LoadingState message="Loading requests…" />
        ) : error ? (
          <EmptyState
            title="Could not load requests"
            body={error}
            action={
              <Button type="button" variant="outline" onClick={() => fetchRows()}>
                Try again
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title={query || status !== 'all' ? 'No requests match' : 'No requests yet'}
            body="Try a different status filter or search text."
          />
        ) : (
          <ul className="grid gap-2.5">
            {rows.map((a) => (
              <li key={a.reference_no}>
                <Link
                  to={`/admin/appointments/${a.reference_no}`}
                  className="block rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold">{a.reference_no}</span>
                    <StatusBadge status={a.status} />
                  </span>
                  <span className="mt-1 block text-sm font-semibold">{a.requester_name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {a.service_name} · {a.appointment_date} · {toAmPm(a.start_time)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pages > 1 ? (
        <nav className="mt-4 flex items-center justify-between gap-2" aria-label="Pagination">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={page <= 1 || loading}
            onClick={() => setPage(page - 1)}
            className="flex-1 sm:flex-none"
          >
            <ChevronLeft className="size-4" aria-hidden="true" /> Newer
          </Button>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Page {page} of {pages} · {total} total
          </p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={page >= pages || loading}
            onClick={() => setPage(page + 1)}
            className="flex-1 sm:flex-none"
          >
            Older <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </nav>
      ) : null}

      <p className="mt-4 text-center">
        <button type="button" onClick={() => fetchRows()} disabled={loading} className="text-xs text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50">
          Reload requests
        </button>
      </p>
    </div>
  )
}
