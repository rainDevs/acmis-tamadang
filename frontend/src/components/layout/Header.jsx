import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import { Clock, HeartPulse, MapPin, Menu, Phone, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/shared/ThemeToggle'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/request', label: 'Request' },
  { to: '/status', label: 'Check status' },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      {/* Facility strip — schedule at a glance, desktop only to save mobile space. */}
      <div className="hidden border-b bg-slate-900 text-slate-200 md:block">
        <ul className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-1.5 text-xs">
          <li className="flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden="true" /> Tamadang, Kiamba, Sarangani
          </li>
          <li className="flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" /> Mon–Fri · 8:00 AM – 5:00 PM
          </li>
          <li className="ml-auto flex items-center gap-1.5">
            <Phone className="size-3.5" aria-hidden="true" /> Contact number posted at the center
          </li>
        </ul>
      </div>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="ACMIS home">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground" aria-hidden="true">
            <HeartPulse className="size-5" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-bold">ACMIS · Tamadang</span>
            <span className="block truncate text-xs text-muted-foreground">Barangay Health Center</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
                  isActive && 'bg-muted text-foreground',
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Button asChild size="sm" className="ml-2">
            <Link to="/admin/login">Staff login</Link>
          </Button>
          <span className="ml-1">
            <ThemeToggle />
          </span>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-lg border transition-colors hover:bg-muted active:scale-95"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t px-4 py-3 md:hidden" aria-label="Mobile">
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-lg px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
                      isActive && 'bg-muted text-foreground',
                    )
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
            <li className="pt-1">
              <Button asChild className="w-full">
                <Link to="/admin/login" onClick={() => setOpen(false)}>
                  Staff login
                </Link>
              </Button>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
