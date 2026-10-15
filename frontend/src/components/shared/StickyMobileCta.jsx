import { Link } from 'react-router'
import { CalendarPlus, Search } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/button'

// Thumb-zone CTA bar: primary action in easy reach on phones.
// Rendered on public pages only; hidden on md+ where header CTAs serve instead.
export default function StickyMobileCta() {
  const reduce = useReducedMotion()
  return (
    <motion.nav
      aria-label="Quick actions"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="grid grid-cols-[1.2fr_1fr] gap-2.5 px-4 py-3">
        <Button asChild size="lg" className="h-12 text-base active:scale-[0.98]">
          <Link to="/request">
            <CalendarPlus className="size-5" aria-hidden="true" />
            Request
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-12 text-base active:scale-[0.98]">
          <Link to="/status">
            <Search className="size-5" aria-hidden="true" />
            Status
          </Link>
        </Button>
      </div>
    </motion.nav>
  )
}
