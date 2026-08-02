export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'TECHNICIAN'

export interface StaffUser {
  id: string
  staffCode: string
  fullName: string
  email: string
  role: UserRole
  mustChangePassword: boolean
}

export interface AuthSession {
  user: StaffUser
  accessToken: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}
