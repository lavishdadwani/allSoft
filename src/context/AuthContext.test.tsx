import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AuthProvider } from './AuthContext'
import { useAuth } from '@/hooks/useAuth'
import { SESSION_EXPIRED_EVENT } from '@/lib/authHeader'
import { setSession, getToken } from '@/lib/session'

vi.mock('@/api/auth', () => ({
  generateOtp: vi.fn(),
  validateOtp: vi.fn(),
}))

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('logs out when apiClient dispatches a session-expired event after a 401', async () => {
    setSession('a-token', 'user-1', '9876543210')

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false)
    })
    expect(getToken()).toBeNull()
  })
})
