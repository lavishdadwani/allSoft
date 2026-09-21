import { describe, expect, it } from 'vitest'
import { assertEnvelopeSuccess, getEnvelopeErrorMessage, isSuccessStatus } from './apiEnvelope'

// Shapes confirmed live against saveDocumentEntry/generateOTP/validateOTP: HTTP 200
// even on business-logic failure, status must be checked explicitly.
describe('assertEnvelopeSuccess', () => {
  it('does not throw on a successful envelope', () => {
    expect(() => assertEnvelopeSuccess({ status: true, message: 'Success. Document Saved.' }, 'fallback')).not.toThrow()
  })

  it('throws with the server message when status is false', () => {
    expect(() => assertEnvelopeSuccess({ status: false, message: 'Invalid File.' }, 'fallback')).toThrow(
      'Invalid File.',
    )
  })

  it('throws with the fallback when the shape is unrecognizable', () => {
    expect(() => assertEnvelopeSuccess(null, 'fallback')).toThrow('fallback')
  })
})

describe('isSuccessStatus / getEnvelopeErrorMessage', () => {
  it('treats status: true as success', () => {
    expect(isSuccessStatus(true)).toBe(true)
  })

  it('prefers a string data field as the error message', () => {
    expect(getEnvelopeErrorMessage({ status: false, data: 'not registered' }, 'x')).toBe('not registered')
  })
})
