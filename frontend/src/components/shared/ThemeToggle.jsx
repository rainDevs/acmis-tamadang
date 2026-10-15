import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const STORAGE_KEY = 'acmis-theme'

// Header theme toggle: light ↔ dark. Initial class is set by the inline script
// in index.html (stored preference, else OS setting) to avoid a flash.
export default function ThemeToggle() {
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  )

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
    } catch {
      // Private mode etc. — theme still applies for this session.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={dark}
      className="inline-flex size-11 items-center justify-center rounded-lg border transition-colors hover:bg-muted active:scale-95"
    >
      {dark ? <Sun className="size-5" aria-hidden="true" /> : <Moon className="size-5" aria-hidden="true" />}
    </button>
  )
}
