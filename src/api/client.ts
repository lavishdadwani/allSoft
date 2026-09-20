import axios from 'axios'
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
    config.headers.token = token
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearSession()
    }
    return Promise.reject(error)
  },
)
