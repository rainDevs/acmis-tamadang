import { Navigate } from 'react-router'
import { useStaffSession } from './useStaffSession'

// Route guard shape enforced for real since TASK-013 (server sessions).
// Waits for the initial session check so reloads don't flash-redirect.
export default function ProtectedRoute({ children }) {
  const { sessionUser, sessionReady } = useStaffSession()
  if (!sessionReady) return null
  if (!sessionUser) {
    return <Navigate to="/admin/login" replace />
  }
  return children
}
