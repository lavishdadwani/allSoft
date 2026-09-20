import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { UploadForm } from '@/components/upload/UploadForm'
import { SearchPage } from '@/components/search/SearchPage'

type Tab = 'upload' | 'search'

export function DashboardPage() {
  const { mobileNumber, logout } = useAuth()
  const [tab, setTab] = useState<Tab>('upload')

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-slate-900">AllSoft Document Management</h1>
            <p className="text-xs text-slate-500">Signed in as {mobileNumber}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin/create-user" className="text-xs text-slate-500 hover:text-slate-800">
              Admin
            </Link>
            <button onClick={logout} className="text-xs font-medium text-red-600 hover:text-red-800">
              Log out
            </button>
          </div>
        </div>
      </header>

      <nav className="max-w-6xl mx-auto px-4 pt-4">
        <div className="inline-flex bg-white rounded-lg border border-slate-200 p-1 gap-1">
          <TabButton active={tab === 'upload'} onClick={() => setTab('upload')}>
            Upload
          </TabButton>
          <TabButton active={tab === 'search'} onClick={() => setTab('search')}>
            Search &amp; Download
          </TabButton>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'upload' ? <UploadForm /> : <SearchPage />}
      </main>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`text-sm font-medium px-4 py-1.5 rounded-md transition-colors ${
        active ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  )
}
