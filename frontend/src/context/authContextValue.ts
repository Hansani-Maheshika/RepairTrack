import { createContext, useContext } from 'react'
import type { StaffUser } from '../types/auth'

export interface AuthContextValue {
  user: StaffUser | null
  isLoading: boolean
  login(email: string, password: string): Promise<StaffUser>
  logout(): Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
