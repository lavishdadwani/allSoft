import { z } from 'zod'
import { getEnvelopeErrorMessage, isSuccessStatus } from '@/lib/apiEnvelope'

export { isSuccessStatus }

export const mobileNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number')

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{4,6}$/, 'Enter the OTP you received')

export const generateOtpRequestSchema = z.object({
  mobile_number: mobileNumberSchema,
})

export const validateOtpRequestSchema = z.object({
  mobile_number: mobileNumberSchema,
  otp: otpSchema,
})

// Confirmed against the live API: both generateOTP and validateOTP reply with
// { status: boolean, data?: string, message?: string }. On success `data` carries
// the payload (the token, for validateOTP); on failure it carries the error text
// (sometimes under `data`, sometimes under `message`).
export const authResponseSchema = z
  .object({
    status: z.union([z.string(), z.number(), z.boolean()]).optional(),
    data: z.union([z.string(), z.object({ token: z.string().optional() }).passthrough()]).optional(),
    message: z.string().optional(),
    token: z.string().optional(),
  })
  .passthrough()

export function getAuthErrorMessage(payload: unknown, fallback: string): string {
  return getEnvelopeErrorMessage(payload, fallback)
}

export function extractToken(payload: unknown): string | undefined {
  const parsed = authResponseSchema.safeParse(payload)
  if (!parsed.success) return undefined
  const { status, token, data } = parsed.data
  if (!isSuccessStatus(status)) return undefined
  if (token) return token
  if (typeof data === 'string') return data
  if (data && typeof data === 'object' && typeof data.token === 'string') return data.token
  return undefined
}
