import { Inbox } from 'lucide-react'

// Centered empty state with an optional action slot.
export default function EmptyState({ title, body, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border bg-card px-4 py-10 text-center shadow-sm">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted" aria-hidden="true">
        <Inbox className="size-5 text-muted-foreground" />
      </span>
      <p className="mt-3 text-sm font-bold">{title}</p>
      {body ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
