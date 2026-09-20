export interface LocalUser {
  username: string
  createdAt: string
}

const STORAGE_KEY = 'dms.localUsers'

export function getLocalUsers(): LocalUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LocalUser[]) : []
  } catch {
    return []
  }
}

export function addLocalUser(username: string): LocalUser[] {
  const users = getLocalUsers()
  const next = [...users, { username, createdAt: new Date().toISOString() }]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}
