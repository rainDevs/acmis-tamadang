import { useState } from 'react'
import { Link } from 'react-router'
import { CheckCircle2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import StatusBadge from '@/components/shared/StatusBadge'
import { toAmPm } from '@/lib/time'

// Confirmation after 201. Reference is selectable + copyable; nothing
// sensitive is shown or stored (name/contact are cleared by the parent).
export default function ConfirmationView({ referenceNo, serviceName, date, slot }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(referenceNo)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-5 text-center shadow-sm sm:p-6">
      <CheckCircle2 className="mx-auto size-10 text-primary" aria-hidden="true" />
      <h2 className="mt-2 text-lg font-bold">Request received</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {serviceName} · {date} · {toAmPm(slot)}
      </p>
      <output className="mt-4 block rounded-xl bg-muted/60 px-4 py-3 font-mono text-lg font-bold tracking-wide select-all">
        {referenceNo}
      </output>
      <Button type="button" variant="outline" size="lg" onClick={copy} className="mt-3 w-full sm:w-auto">
        <Copy className="size-4" aria-hidden="true" />
        {copied ? 'Copied' : 'Copy reference'}
      </Button>
      <div className="mt-4 flex justify-center">
        <StatusBadge status="pending" />
      </div>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Your request is <strong>pending until staff confirm it</strong>. Show this reference number at the health
        center on your visit.
      </p>
      <Button asChild size="lg" className="mt-5 w-full sm:w-auto">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  )
}
