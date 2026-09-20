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

// Backend response shape isn't formally documented; we validate defensively and
// accept any of the common places a token/status might show up.
export const authResponseSchema = z
  .object({
    token: z.string().optional(),
    data: z.union([z.string(), z.object({ token: z.string().optional() }).passthrough()]).optional(),
    status: z.union([z.string(), z.number(), z.boolean()]).optional(),
    message: z.string().optional(),
  })
  .passthrough()

export function extractToken(payload: unknown): string | undefined {
  const parsed = authResponseSchema.safeParse(payload)
  if (!parsed.success) return undefined
  const { token, data } = parsed.data
  if (token) return token
  if (typeof data === 'string') return data
  if (data && typeof data === 'object' && typeof data.token === 'string') return data.token
  return undefined
}
