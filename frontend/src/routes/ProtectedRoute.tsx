import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authContextValue'
import type { UserRole } from '../types/auth'

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <main className="grid min-h-screen place-items-center bg-slate-100"><p className="text-slate-600">Checking your session…</p></main>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (user.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />
  }
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />
  return <Outlet />
}
