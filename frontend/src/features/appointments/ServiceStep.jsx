import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// Step 1: pick one active service. Full-width radio-style cards, 44px+ targets.
export default function ServiceStep({ services, selectedId, onSelect }) {
  return (
    <ul className="grid gap-2.5">
      {services.map((s) => {
        const active = s.id === selectedId
        return (
          <li key={s.id}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(s.id)}
              className={cn(
                'flex min-h-[44px] w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left shadow-sm transition-colors',
                'hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                active && 'border-primary ring-1 ring-ring',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border',
                  active ? 'border-primary bg-primary text-primary-foreground' : 'border-input text-transparent',
                )}
              >
                <Check className="size-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{s.name}</span>
                <span className="block text-xs text-muted-foreground">About {s.duration_minutes} min per visit</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
