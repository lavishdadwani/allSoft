import { z } from 'zod'

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

function isSuccessStatus(status: unknown): boolean {
  if (typeof status === 'boolean') return status
  if (typeof status === 'number') return status === 1 || status === 200
  if (typeof status === 'string') return ['true', '1', 'success', 'ok'].includes(status.toLowerCase())
  return false
}

export function getAuthErrorMessage(payload: unknown, fallback: string): string {
  const parsed = authResponseSchema.safeParse(payload)
  if (!parsed.success) return fallback
  if (typeof parsed.data.data === 'string') return parsed.data.data
  if (parsed.data.message) return parsed.data.message
  return fallback
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
