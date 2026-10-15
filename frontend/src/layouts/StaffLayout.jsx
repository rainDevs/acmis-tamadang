import { Outlet } from 'react-router'
import { HeartPulse } from 'lucide-react'
import ThemeToggle from '@/components/shared/ThemeToggle'

// Minimal staff shell (TASK-016). No navigation yet — TASK-017 adds section
// nav once the staff screens exist. No auth enforcement here (TASK-013).
export default function StaffLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
          Skip to content
        </a>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <p className="flex min-w-0 items-center gap-2.5" aria-label="ACMIS staff">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground" aria-hidden="true">
              <HeartPulse className="size-5" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-bold">ACMIS · Staff</span>
              <span className="block truncate text-xs text-muted-foreground">Tamadang Health Center</span>
            </span>
          </p>
          <ThemeToggle />
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
