import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { generateOtp, validateOtp } from '@/api/auth'
import { SESSION_EXPIRED_EVENT } from '@/lib/authHeader'
import { clearSession, getMobileNumber, getToken, getUserId, setSession } from '@/lib/session'

interface AuthContextValue {
  token: string | null
  userId: string | null
  mobileNumber: string | null
  isAuthenticated: boolean
  requestOtp: (mobileNumber: string) => Promise<void>
  login: (mobileNumber: string, otp: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getToken())
  const [userId, setUserId] = useState<string | null>(() => getUserId())
  const [mobileNumber, setMobileNumber] = useState<string | null>(() => getMobileNumber())

  const requestOtp = useCallback(async (mobile: string) => {
    await generateOtp(mobile)
  }, [])

  const login = useCallback(async (mobile: string, otp: string) => {
    const newToken = await validateOtp(mobile, otp)
    const derivedUserId = mobile
    setSession(newToken, derivedUserId, mobile)
    setToken(newToken)
    setUserId(derivedUserId)
    setMobileNumber(mobile)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setToken(null)
    setUserId(null)
    setMobileNumber(null)
  }, [])

  // apiClient's response interceptor clears the session in localStorage on any
  // 401, but has no way to reach into React state directly — it dispatches this
  // event instead so isAuthenticated/token stay in sync and ProtectedRoute
  // redirects to /login instead of continuing to render as logged in.
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, logout)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, logout)
  }, [logout])

  const value = useMemo(
    () => ({
      token,
      userId,
      mobileNumber,
      isAuthenticated: Boolean(token),
      requestOtp,
      login,
      logout,
    }),
    [token, userId, mobileNumber, requestOtp, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
