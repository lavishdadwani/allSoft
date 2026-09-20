import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { LoginPage } from './LoginPage'

vi.mock('@/api/auth', () => ({
  generateOtp: vi.fn().mockResolvedValue(undefined),
  validateOtp: vi.fn().mockResolvedValue('fake-token'),
}))

function renderLoginPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('LoginPage', () => {
  it('shows a validation error for an invalid mobile number', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText(/mobile number/i), '123')
    await user.click(screen.getByRole('button', { name: /send otp/i }))

    expect(await screen.findByText(/valid 10-digit mobile number/i)).toBeInTheDocument()
  })

  it('moves to the OTP step after a valid mobile number is submitted', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText(/mobile number/i), '9876543210')
    await user.click(screen.getByRole('button', { name: /send otp/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/enter otp/i)).toBeInTheDocument()
    })
  })
})
