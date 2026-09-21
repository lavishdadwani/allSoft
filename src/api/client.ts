import axios from 'axios'
import { AUTH_HEADER_NAME, SESSION_EXPIRED_EVENT } from '@/lib/authHeader'
import { getToken, clearSession } from '@/lib/session'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://apis.allsoft.co/api/documentManagement'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
})

const API_ORIGIN = new URL(API_BASE_URL).origin

export function isSameOriginAsApi(url: string | undefined): boolean {
  if (!url) return true // relative path with no host — resolves against baseURL
  if (!/^https?:\/\//i.test(url)) return true // relative path
  try {
    return new URL(url).origin === API_ORIGIN
  } catch {
    return false
  }
}

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  // Confirmed live: searchDocumentEntry's file_url is a pre-signed AWS S3 URL, a
  // different origin from the API and already authenticated via its own query-string
  // signature. Attaching our app's token header to that request would leak the
  // token to a third-party domain for no reason, and risks the browser blocking the
  // request over CORS if S3's bucket policy doesn't allow that header. Only attach
  // it for requests actually going to our own API.
  if (token && isSameOriginAsApi(config.url)) {
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
