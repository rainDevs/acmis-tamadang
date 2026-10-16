import { useCallback, useEffect, useMemo, useState } from 'react'
import { StaffSessionContext } from './useStaffSession'
import { staffLogin, staffLogout, staffMe } from '@/services/api'

// Live server session (TASK-013). Appointment data is fetched live per
// screen since TASK-015 — no demo copy lives here anymore.
export function StaffSessionProvider({ children }) {
  // null = unknown yet (checking), false = signed out, object = signed in.
  const [sessionUser, setSessionUser] = useState(null)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    let active = true
    staffMe()
      .then((res) => {
        if (active) setSessionUser(res.data.user)
      })
      .catch(() => {
        if (active) setSessionUser(false)
      })
      .finally(() => {
        if (active) setSessionReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  const signIn = useCallback(async (username, password) => {
    const res = await staffLogin(username, password)
    setSessionUser(res.data.user)
    return res.data.user
  }, [])

  const signOut = useCallback(async () => {
    try {
      await staffLogout()
    } catch {
      // Session already gone server-side; still clear local state.
    }
    setSessionUser(false)
  }, [])

  const value = useMemo(
    () => ({
      sessionUser: sessionUser || null,
      sessionReady,
      signIn,
      signOut,
    }),
    [sessionUser, sessionReady, signIn, signOut],
  )
  return <StaffSessionContext.Provider value={value}>{children}</StaffSessionContext.Provider>
}
