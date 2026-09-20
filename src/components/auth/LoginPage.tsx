import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import { mobileNumberSchema, otpSchema } from '@/types/auth'

type Step = 'mobile' | 'otp'

export function LoginPage() {
  const { requestOtp, login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('mobile')
  const [mobileNumber, setMobileNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

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
      </div>
    </div>
  )
}
