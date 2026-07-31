import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse, AuthSession } from '../types/auth'
import { getAccessToken, setAccessToken } from './tokenStore'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api/v1'

export const api = axios.create({ baseURL, withCredentials: true })
const sessionApi = axios.create({ baseURL, withCredentials: true })

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

let refreshPromise: Promise<AuthSession> | null = null

export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = sessionApi
      .post<ApiResponse<AuthSession>>('/auth/refresh')
      .then(({ data }) => {
        setAccessToken(data.data.accessToken)
        return data.data
      })
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryConfig | undefined
    const isAuthenticationRequest = request?.url?.startsWith('/auth/')
    if (error.response?.status !== 401 || !request || request._retry || isAuthenticationRequest) {
      return Promise.reject(error)
    }
    request._retry = true
    try {
      await refreshSession()
      return api(request)
    } catch {
      setAccessToken(null)
      window.dispatchEvent(new Event('repairtrack:session-expired'))
      return Promise.reject(error)
    }
  },
)

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? 'Unable to contact the server'
  }
  return error instanceof Error ? error.message : 'Something went wrong'
}
