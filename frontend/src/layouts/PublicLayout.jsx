import { Outlet } from 'react-router'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import StickyMobileCta from '@/components/shared/StickyMobileCta'

export default function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <StickyMobileCta />
    </div>
  )
}
