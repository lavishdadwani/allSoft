import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/components/auth/LoginPage'
import { AdminUserForm } from '@/components/auth/AdminUserForm'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { NetworkStatusBanner } from '@/components/common/NetworkStatusBanner'
import { DashboardPage } from '@/pages/DashboardPage'

export function App() {
  return (
    <>
      <NetworkStatusBanner />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/create-user" element={<AdminUserForm />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
