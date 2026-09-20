import { apiClient } from '@/api/client'
import { extractToken, generateOtpRequestSchema, validateOtpRequestSchema } from '@/types/auth'

export async function generateOtp(mobileNumber: string): Promise<void> {
  const payload = generateOtpRequestSchema.parse({ mobile_number: mobileNumber })
  await apiClient.post('/generateOTP', payload)
}

export async function validateOtp(mobileNumber: string, otp: string): Promise<string> {
  const payload = validateOtpRequestSchema.parse({ mobile_number: mobileNumber, otp })
  const { data } = await apiClient.post('/validateOTP', payload)
  const token = extractToken(data)
  if (!token) {
    throw new Error('Login succeeded but no token was returned by the server.')
  }
  return token
}
