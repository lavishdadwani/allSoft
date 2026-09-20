const TOKEN_KEY = 'dms.token'
const USER_ID_KEY = 'dms.userId'
const MOBILE_KEY = 'dms.mobile'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY)
}

export function getMobileNumber(): string | null {
  return localStorage.getItem(MOBILE_KEY)
}

export function setSession(token: string, userId: string, mobileNumber: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_ID_KEY, userId)
  localStorage.setItem(MOBILE_KEY, mobileNumber)
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(MOBILE_KEY)
}
