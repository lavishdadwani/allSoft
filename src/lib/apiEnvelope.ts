import { z } from 'zod'

// Every documentManagement endpoint we've probed live (generateOTP, validateOTP,
// saveDocumentEntry, documentTags) replies with this same envelope shape and
// returns HTTP 200 even on business-logic failure — status must be checked
// explicitly, since axios won't throw on its own.
const envelopeSchema = z
  .object({
    status: z.union([z.string(), z.number(), z.boolean()]).optional(),
    data: z.unknown().optional(),
    message: z.string().optional(),
  })
  .passthrough()

export function isSuccessStatus(status: unknown): boolean {
  if (typeof status === 'boolean') return status
  if (typeof status === 'number') return status === 1 || status === 200
  if (typeof status === 'string') return ['true', '1', 'success', 'ok'].includes(status.toLowerCase())
  return false
}

export function getEnvelopeErrorMessage(payload: unknown, fallback: string): string {
  const parsed = envelopeSchema.safeParse(payload)
  if (!parsed.success) return fallback
  if (typeof parsed.data.data === 'string') return parsed.data.data
  if (parsed.data.message) return parsed.data.message
  return fallback
}

export function assertEnvelopeSuccess(payload: unknown, fallback: string): void {
  const parsed = envelopeSchema.safeParse(payload)
  if (!parsed.success || !isSuccessStatus(parsed.data.status)) {
    throw new Error(getEnvelopeErrorMessage(payload, fallback))
  }
}
