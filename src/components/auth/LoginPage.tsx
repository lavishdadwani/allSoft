import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import { mobileNumberSchema, otpSchema } from '@/types/auth'

type Step = 'mobile' | 'otp'

export function LoginPage() {
  const { requestOtp, login, devLogin } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('mobile')
  const [mobileNumber, setMobileNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [devToken, setDevToken] = useState('')

  const otpMutation = useMutation({
    mutationFn: () => requestOtp(mobileNumber),
    onSuccess: () => {
      setStep('otp')
      showToast('OTP sent to your mobile number.', 'success')
    },
    onError: (error) => {
      showToast(getErrorMessage(error, 'Failed to send OTP.'), 'error')
    },
  })

  const loginMutation = useMutation({
    mutationFn: () => login(mobileNumber, otp),
    onSuccess: () => {
      showToast('Logged in successfully.', 'success')
      navigate('/', { replace: true })
    },
    onError: (error) => {
      showToast(getErrorMessage(error, 'Invalid OTP. Please try again.'), 'error')
    },
  })

  function handleMobileSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = mobileNumberSchema.safeParse(mobileNumber)
    if (!result.success) {
      setFieldError(result.error.issues[0]?.message ?? 'Invalid mobile number')
      return
    }
    setFieldError(null)
    otpMutation.mutate()
  }

  function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = otpSchema.safeParse(otp)
    if (!result.success) {
      setFieldError(result.error.issues[0]?.message ?? 'Invalid OTP')
      return
    }
    setFieldError(null)
    loginMutation.mutate()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-xl font-semibold text-slate-900">Document Management System</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">Sign in with your mobile number</p>

        {step === 'mobile' && (
          <form onSubmit={handleMobileSubmit} className="space-y-4">
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-slate-700 mb-1">
                Mobile number
              </label>
              <input
                id="mobile"
                type="tel"
                inputMode="numeric"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              {fieldError && <p className="text-xs text-red-600 mt-1">{fieldError}</p>}
            </div>
            <button
              type="submit"
              disabled={otpMutation.isPending}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {otpMutation.isPending ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1">
                Enter OTP sent to {mobileNumber}
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="OTP"
                autoFocus
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              {fieldError && <p className="text-xs text-red-600 mt-1">{fieldError}</p>}
            </div>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {loginMutation.isPending ? 'Verifying…' : 'Verify & Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('mobile')
                setOtp('')
              }}
              className="w-full text-xs text-slate-500 hover:text-slate-700"
            >
              Use a different mobile number
            </button>
          </form>
        )}

        {import.meta.env.DEV && (
          <div className="mt-6 border-t border-dashed border-amber-300 pt-4 space-y-3">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
              Dev only — stripped from production builds
            </p>
            <p className="text-xs text-slate-500">
              The backend's OTP registration allowlist is blocking real logins right now.
              Use one of these to bypass the OTP step and exercise the rest of the app.
            </p>

            <button
              type="button"
              onClick={() => {
                const mobile = mobileNumber || '9999999999'
                devLogin(mobile, 'dev-fake-token')
                showToast('Dev session started (fake token — real API calls will 401).', 'info')
                navigate('/', { replace: true })
              }}
              className="w-full bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-medium py-2 rounded-lg transition-colors"
            >
              Skip login with a fake token
            </button>

            <div className="flex gap-2">
              <input
                type="text"
                value={devToken}
                onChange={(e) => setDevToken(e.target.value)}
                placeholder="Paste a real token (e.g. from Postman)"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              <button
                type="button"
                disabled={!devToken.trim()}
                onClick={() => {
                  const mobile = mobileNumber || '9999999999'
                  devLogin(mobile, devToken.trim())
                  showToast('Dev session started with the provided token.', 'success')
                  navigate('/', { replace: true })
                }}
                className="bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-medium px-3 rounded-lg transition-colors"
              >
                Use token
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
