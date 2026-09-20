import { useState } from 'react'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useToast } from '@/hooks/useToast'
import { addLocalUser, getLocalUsers, type LocalUser } from '@/lib/localUsers'

const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export function AdminUserForm() {
  const { showToast } = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({})
  const [users, setUsers] = useState<LocalUser[]>(() => getLocalUsers())

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = createUserSchema.safeParse({ username, password })
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors
      setErrors({ username: flat.username?.[0], password: flat.password?.[0] })
      return
    }
    setErrors({})
    // No user-management endpoint is defined in the API contract for this assignment;
    // this is a static admin form. We persist only the username locally for display,
    // never the password.
    setUsers(addLocalUser(username))
    setUsername('')
    setPassword('')
    showToast(`User "${result.data.username}" created.`, 'success')
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold text-slate-900">Admin · Create User</h1>
          <Link to="/login" className="text-xs text-brand-600 hover:underline">
            Back to login
          </Link>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Static admin form for user creation (no user-management endpoint is exposed by the
          backend for this assignment).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            {errors.username && <p className="text-xs text-red-600 mt-1">{errors.username}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            Create user
          </button>
        </form>

        {users.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Created users
            </h2>
            <ul className="space-y-1">
              {users.map((u) => (
                <li key={u.username + u.createdAt} className="text-sm text-slate-700">
                  {u.username}{' '}
                  <span className="text-xs text-slate-400">
                    · {new Date(u.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
