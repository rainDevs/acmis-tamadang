import { createContext, useContext } from 'react'

export const StaffSessionContext = createContext(null)

export function useStaffSession() {
  const ctx = useContext(StaffSessionContext)
  if (!ctx) throw new Error('useStaffSession must be used inside StaffSessionProvider')
  return ctx
}
