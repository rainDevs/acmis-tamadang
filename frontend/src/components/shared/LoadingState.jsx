import { Loader2 } from 'lucide-react'

// Centered loading state. Text label keeps it meaningful when motion is reduced.
export default function LoadingState({ message = 'Loading…' }) {
  return (
    <p role="status" className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
      <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      {message}
    </p>
  )
}
