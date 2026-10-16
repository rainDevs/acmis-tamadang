import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import Reveal from '@/components/shared/Reveal'

export default function StaffLoginPlaceholder() {
  return (
    <div className="mx-auto max-w-md px-4 py-10 text-center sm:px-6">
      <Reveal>
      <h1 className="text-2xl font-bold">Staff portal</h1>
      <p className="mt-2 text-sm text-muted-foreground">Secure staff login (Phase 4) will live here. Secure session, roles, and audit logging are backend-enforced.</p>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/">Back to home</Link>
      </Button>
      </Reveal>
    </div>
  )
}
