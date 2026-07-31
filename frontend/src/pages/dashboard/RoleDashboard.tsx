import { useAuth } from '../../context/authContextValue'

export function RoleDashboard() {
  const { user } = useAuth()
  return <div><p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">{user?.role.replace('_', ' ')}</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Welcome, {user?.fullName}</h1><p className="mt-3 text-slate-600">Your session and role-protected dashboard are working. Dashboard data will be connected in a later step.</p><div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-semibold">Authentication completed</h2><p className="mt-2 text-slate-600">You can refresh this page without logging in again because the backend refresh cookie restores your session.</p></div></div>
}
