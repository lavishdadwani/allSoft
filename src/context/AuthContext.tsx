import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'
import { generateOtp, validateOtp } from '@/api/auth'
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
