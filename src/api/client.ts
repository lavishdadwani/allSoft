import axios from 'axios'
import { AUTH_HEADER_NAME, SESSION_EXPIRED_EVENT } from '@/lib/authHeader'
import { getToken, clearSession } from '@/lib/session'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://apis.allsoft.co/api/documentManagement'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    // The backend expects the token in a custom "token" header (see Postman collection),
    // not the standard Authorization scheme.
    config.headers[AUTH_HEADER_NAME] = token
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearSession()
      // AuthContext holds its own React state mirroring the session; without this,
      // clearing localStorage alone wouldn't update isAuthenticated, and the app
      // would keep rendering as "logged in" while every request 401s silently.
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    return Promise.reject(error)
  },
)
