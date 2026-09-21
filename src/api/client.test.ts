import { describe, expect, it } from 'vitest'
import { isSameOriginAsApi } from './client'

// Confirmed live: searchDocumentEntry's file_url points at a pre-signed S3 URL on
// a completely different origin from the API (apis.allsoft.co vs. an S3 bucket
// domain). The auth token header must never be attached to that request.
describe('isSameOriginAsApi', () => {
  it('treats relative paths (our own API calls) as same-origin', () => {
    expect(isSameOriginAsApi('/searchDocumentEntry')).toBe(true)
    expect(isSameOriginAsApi(undefined)).toBe(true)
  })

  it('rejects a pre-signed S3 URL on a different origin', () => {
    expect(
      isSameOriginAsApi(
        'https://allsoft-consulting.s3.ap-south-1.amazonaws.com/fileUploads/2024-02-26/x.jpg?X-Amz-Signature=abc',
      ),
    ).toBe(false)
  })

  it('accepts an absolute URL that does match the API origin', () => {
    expect(isSameOriginAsApi('https://apis.allsoft.co/api/documentManagement/searchDocumentEntry')).toBe(
      true,
    )
  })
})
