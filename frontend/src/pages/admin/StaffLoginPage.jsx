import { Link } from 'react-router'
import StaffLoginForm from '@/features/staff/StaffLoginForm'
import Reveal from '@/components/shared/Reveal'

// Staff entry point. Live server sessions since TASK-013.
export default function StaffLoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <Reveal>
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">Staff only</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Staff sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Sessions are verified on every request. Only authorized staff may sign in here.
        </p>
      </Reveal>
      <Reveal delay={0.06}>
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100" role="note">
          After 5 wrong attempts your account locks for 5 minutes. Contact the administrator if you get locked out.
        </div>
      </Reveal>
      <Reveal delay={0.12}>
        <div className="mt-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <StaffLoginForm />
        </div>
      </Reveal>
      <Reveal delay={0.18}>
        <p className="mt-4 text-center text-sm">
          <Link to="/" className="text-primary underline-offset-4 hover:underline">
            Back to public site
          </Link>
        </p>
      </Reveal>
    </div>
  )
}
