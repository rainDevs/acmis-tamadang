import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router'
import { HeartPulse, LogOut, Menu, Moon, Sun, UserRound, X } from 'lucide-react'
import { Modal } from '@/components/ui/dialog'
import StaffSidebar from '@/components/layout/StaffSidebar'
import { useStaffSession } from '@/features/staff/useStaffSession'

const THEME_STORAGE_KEY = 'acmis-theme'

function initialsFor(user) {
  const source = (user?.display_name || user?.username || '').trim()
  if (!source) return ''
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

// Staff shell (TASK-017, auth live since TASK-013): mobile hamburger opens the
// module drawer; the header avatar opens Profile / theme / sign-out. The
// Dashboard + Requests links live only in the sidebar/drawer (single source).
export default function StaffLayout() {
  const { sessionUser, signOut } = useStaffSession()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  )
  const hamburgerRef = useRef(null)
  const avatarButtonRef = useRef(null)
  const menuRef = useRef(null)
  const drawerCloseRef = useRef(null)

  function onSignOut() {
    setMenuOpen(false)
    setSidebarOpen(false)
    signOut()
    navigate('/admin/login', { replace: true })
  }

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light')
    } catch {
      // Private mode etc. — theme still applies for this session.
    }
    setMenuOpen(false)
    avatarButtonRef.current?.focus()
  }

  // Drawer: Escape closes, focus lands on the close button when opened and
  // returns to the hamburger when closed. Body scroll locks while open.
  useEffect(() => {
    if (!sidebarOpen) return
    const trigger = hamburgerRef.current
    drawerCloseRef.current?.focus()
    document.body.style.overflow = 'hidden'
    function onKey(e) {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      trigger?.focus()
    }
  }, [sidebarOpen])

  // Avatar menu: Escape + outside-click close, focus returns to the avatar.
  useEffect(() => {
    if (!menuOpen) return
    function onKey(e) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        avatarButtonRef.current?.focus()
      }
    }
    function onPointer(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [menuOpen])

  const initials = initialsFor(sessionUser)

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
          Skip to content
        </a>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              ref={hamburgerRef}
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-lg transition-colors hover:bg-muted active:scale-95 md:hidden"
              aria-expanded={sidebarOpen}
              aria-controls="staff-mobile-nav"
              aria-label={sidebarOpen ? 'Close staff menu' : 'Open staff menu'}
              onClick={() => setSidebarOpen((v) => !v)}
            >
              {sidebarOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            </button>
            <Link to="/admin" className="flex min-w-0 items-center gap-2.5" aria-label="ACMIS staff dashboard">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground" aria-hidden="true">
                <HeartPulse className="size-5" />
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-bold">ACMIS · Staff</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {sessionUser ? sessionUser.display_name || sessionUser.username : 'Tamadang Health Center'}
                </span>
              </span>
            </Link>
          </div>
          <div ref={menuRef} className="relative">
            <button
              ref={avatarButtonRef}
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-full border bg-muted font-bold transition-colors hover:bg-muted/70 active:scale-95"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close account menu' : 'Open account menu'}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {initials ? (
                <span aria-hidden="true" className="text-sm">{initials}</span>
              ) : (
                <UserRound className="size-5" aria-hidden="true" />
              )}
            </button>
            {menuOpen ? (
              <div
                role="menu"
                aria-label="Account"
                className="absolute top-full right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border bg-background shadow-lg"
              >
                <p className="border-b px-4 py-3 leading-tight">
                  <span className="block truncate text-sm font-bold">{sessionUser?.display_name || sessionUser?.username || 'Staff'}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {sessionUser ? `${sessionUser.username} · ${sessionUser.role}` : 'Tamadang Health Center'}
                  </span>
                </p>
                <div className="p-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    className="flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-muted"
                    onClick={() => {
                      setMenuOpen(false)
                      setProfileOpen(true)
                    }}
                  >
                    <UserRound className="size-4 shrink-0" aria-hidden="true" />
                    Profile
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-muted"
                    onClick={toggleTheme}
                  >
                    {dark ? <Sun className="size-4 shrink-0" aria-hidden="true" /> : <Moon className="size-4 shrink-0" aria-hidden="true" />}
                    {dark ? 'Switch to light mode' : 'Switch to dark mode'}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    onClick={onSignOut}
                  >
                    <LogOut className="size-4 shrink-0" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close staff menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div
            id="staff-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Staff modules"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r bg-background shadow-lg"
          >
            <div className="flex h-16 items-center justify-between gap-2 border-b px-4">
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground" aria-hidden="true">
                  <HeartPulse className="size-5" />
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-sm font-bold">ACMIS · Staff</span>
                  <span className="block truncate text-xs text-muted-foreground">Modules</span>
                </span>
              </span>
              <button
                ref={drawerCloseRef}
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-lg transition-colors hover:bg-muted active:scale-95"
                aria-label="Close staff menu"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <StaffSidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6 sm:px-6">
        <aside className="sticky top-24 hidden h-fit w-60 shrink-0 md:block">
          <StaffSidebar />
        </aside>
        <main id="main" className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
      <Modal open={profileOpen} onOpenChange={setProfileOpen} labelledBy="staff-profile-title">
        <h2 id="staff-profile-title" className="pr-10 text-base font-bold">
          Staff profile
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Name</dt>
            <dd className="mt-0.5 font-medium">{sessionUser?.display_name || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Username</dt>
            <dd className="mt-0.5 font-medium">{sessionUser?.username || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Role</dt>
            <dd className="mt-0.5 font-medium">{sessionUser?.role || '—'}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Account changes live in Users administration once it ships.
        </p>
      </Modal>
    </div>
  )
}
