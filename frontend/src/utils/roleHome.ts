import type { UserRole } from '../types/auth'

export function roleHome(role: UserRole) {
  if (role === 'ADMIN') return '/admin/dashboard'
  if (role === 'RECEPTIONIST') return '/receptionist/dashboard'
  return '/technician/dashboard'
}
