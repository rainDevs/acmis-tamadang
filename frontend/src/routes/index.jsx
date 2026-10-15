import { BrowserRouter, Route, Routes } from 'react-router'
import PublicLayout from '@/layouts/PublicLayout'
import LandingPage from '@/pages/public/LandingPage'
import RequestPage from '@/pages/public/RequestPage'
import StatusPage from '@/pages/public/StatusPage'
import NotFoundPage from '@/pages/public/NotFoundPage'
import StaffLoginPlaceholder from '@/pages/admin/StaffLoginPlaceholder'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="request" element={<RequestPage />} />
          <Route path="status" element={<StatusPage />} />
          <Route path="admin/login" element={<StaffLoginPlaceholder />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
