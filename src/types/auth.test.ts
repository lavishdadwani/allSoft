import { describe, expect, it } from 'vitest'
import { extractToken, getAuthErrorMessage } from './auth'

// These shapes are taken from live probes against the real API
// (https://apis.allsoft.co/api/documentManagement), not guesses.
describe('extractToken', () => {
  it('returns undefined when status is false, even if data looks like a string', () => {
    const payload = { status: false, data: 'This Mobile Number is not yet Registered.' }
    expect(extractToken(payload)).toBeUndefined()
  })

  it('returns undefined for a failed OTP validation', () => {
    const payload = { status: false, message: 'Error : Invalid OTP' }
    expect(extractToken(payload)).toBeUndefined()
  })

  it('extracts the token from data on success', () => {
    const payload = { status: true, data: 'abc.def.ghi' }
    expect(extractToken(payload)).toBe('abc.def.ghi')
  })
})

describe('getAuthErrorMessage', () => {
  it('prefers the data field when it is a string', () => {
    const payload = { status: false, data: 'This Mobile Number is not yet Registered.' }
    expect(getAuthErrorMessage(payload, 'fallback')).toBe('This Mobile Number is not yet Registered.')
  })

  it('falls back to message when data is absent', () => {
    const payload = { status: false, message: 'Error : Invalid OTP' }
    expect(getAuthErrorMessage(payload, 'fallback')).toBe('Error : Invalid OTP')
  })

  it('uses the fallback when the shape is unrecognizable', () => {
    expect(getAuthErrorMessage(null, 'fallback')).toBe('fallback')
  })
})
