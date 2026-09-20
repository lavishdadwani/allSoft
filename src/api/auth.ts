import { apiClient } from '@/api/client'
import {
  extractToken,
  generateOtpRequestSchema,
  getAuthErrorMessage,
  validateOtpRequestSchema,
} from '@/types/auth'

// The API returns HTTP 200 even for business-logic failures (e.g. an unregistered
// number or a wrong OTP), signalling success/failure only via `status` in the body.
export async function generateOtp(mobileNumber: string): Promise<void> {
  const payload = generateOtpRequestSchema.parse({ mobile_number: mobileNumber })
  const { data } = await apiClient.post('/generateOTP', payload)
  const status = (data as { status?: unknown } | undefined)?.status
  if (status !== true) {
    throw new Error(getAuthErrorMessage(data, 'Failed to send OTP. Please try again.'))
  }
}

export async function validateOtp(mobileNumber: string, otp: string): Promise<string> {
  const payload = validateOtpRequestSchema.parse({ mobile_number: mobileNumber, otp })
  const { data } = await apiClient.post('/validateOTP', payload)
  const token = extractToken(data)
  if (!token) {
    throw new Error(getAuthErrorMessage(data, 'Invalid OTP. Please try again.'))
  }
  return token
}
