import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, refreshSession } from '../lib/api'
import { setAccessToken } from '../lib/tokenStore'
import type { ApiResponse, AuthSession, StaffUser } from '../types/auth'
import { AuthContext } from './authContextValue'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearSession = useCallback(() => {
    setAccessToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    let active = true
    refreshSession()
      .then((session) => { if (active) setUser(session.user) })
      .catch(() => { if (active) clearSession() })
      .finally(() => { if (active) setIsLoading(false) })
    const expired = () => clearSession()
    window.addEventListener('repairtrack:session-expired', expired)
    return () => {
      active = false
      window.removeEventListener('repairtrack:session-expired', expired)
    }
  }, [clearSession])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<ApiResponse<AuthSession>>('/auth/login', { email, password })
    setAccessToken(data.data.accessToken)
    setUser(data.data.user)
    return data.data.user
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } finally { clearSession() }
  }, [clearSession])

  const value = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
