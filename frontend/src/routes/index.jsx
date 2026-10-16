import { BrowserRouter, Route, Routes } from 'react-router'
import PublicLayout from '@/layouts/PublicLayout'
import StaffLayout from '@/layouts/StaffLayout'
import LandingPage from '@/pages/public/LandingPage'
import RequestPage from '@/pages/public/RequestPage'
import StatusPage from '@/pages/public/StatusPage'
import NotFoundPage from '@/pages/public/NotFoundPage'
import StaffLoginPage from '@/pages/admin/StaffLoginPage'
import DashboardPage from '@/pages/admin/DashboardPage'
import AppointmentsPage from '@/pages/admin/AppointmentsPage'
import AppointmentDetailPage from '@/pages/admin/AppointmentDetailPage'
import ServicesPage from '@/pages/admin/ServicesPage'
import ProtectedRoute from '@/features/staff/ProtectedRoute'
import { StaffSessionProvider } from '@/features/staff/session'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <StaffSessionProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="request" element={<RequestPage />} />
            <Route path="status" element={<StatusPage />} />
            <Route path="admin/login" element={<StaffLoginPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route
            element={
              <ProtectedRoute>
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            <Route path="admin/appointments" element={<AppointmentsPage />} />
            <Route path="admin/appointments/:referenceNo" element={<AppointmentDetailPage />} />
            <Route path="admin/services" element={<ServicesPage />} />
            <Route path="admin" element={<DashboardPage />} />
          </Route>
        </Routes>
      </StaffSessionProvider>
    </BrowserRouter>
  )
}
