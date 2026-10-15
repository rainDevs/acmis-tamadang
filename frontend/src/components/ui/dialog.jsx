import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Shared modal dialog (booking review, staff confirms). Mobile-first: bottom
// sheet on small screens, centered card from sm up. Focus is trapped by Radix;
// Escape closes; the X button has an accessible label.
export function Modal({ open, onOpenChange, labelledBy, describedBy, children, className }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 max-h-[88svh] overflow-y-auto rounded-t-2xl border bg-background p-5 shadow-lg',
            'sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:p-6',
            className,
          )}
        >
          {children}
          <Dialog.Close
            aria-label="Close dialog"
            className="absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" aria-hidden="true" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
