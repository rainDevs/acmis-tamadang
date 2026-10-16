import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormError } from '@/components/ui/field'
import { Modal } from '@/components/ui/dialog'
import { toAmPm } from '@/lib/time'

// Review before submit. Confirm is guarded against double taps; the server
// revalidates and may still answer 409 (slot taken meanwhile).
export default function ReviewDialog({ open, onClose, summary, submitting, error, onConfirm }) {
  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()} labelledBy="review-title">
      <h2 id="review-title" className="pr-8 text-base font-bold">
        Review your request
      </h2>
      <dl className="mt-3 grid gap-2 rounded-xl bg-muted/60 p-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Service</dt>
          <dd className="text-right font-semibold">{summary.serviceName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Date</dt>
          <dd className="font-mono font-semibold">{summary.date}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Time</dt>
          <dd className="font-semibold">{toAmPm(summary.slot)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Name</dt>
          <dd className="text-right font-semibold">{summary.fullName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Address</dt>
          <dd className="text-right font-semibold">{summary.address}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Mobile</dt>
          <dd className="font-mono font-semibold">{summary.contactNumber}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Your request stays pending until health center staff review it. This is for routine requests only —
        emergencies go directly to the health center.
      </p>
      {error ? (
        <div className="mt-3">
          <FormError message={error} />
        </div>
      ) : null}
      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <Button type="button" variant="outline" size="lg" onClick={onClose} disabled={submitting} className="sm:flex-1">
          Edit
        </Button>
        <Button type="button" size="lg" onClick={onConfirm} disabled={submitting} className="sm:flex-1">
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Submitting…
            </>
          ) : (
            'Confirm request'
          )}
        </Button>
      </div>
    </Modal>
  )
}
