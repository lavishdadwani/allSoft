import { describe, expect, it, vi } from 'vitest'
import { searchDocuments, uploadDocument } from './documents'

const postMock = vi.fn()
vi.mock('@/api/client', () => ({
  apiClient: { post: (...args: unknown[]) => postMock(...args) },
}))

describe('uploadDocument', () => {
  const input = {
    file: new File(['x'], 'report.pdf', { type: 'application/pdf' }),
    meta: {
      major_head: 'Personal' as const,
      minor_head: 'John',
      document_date: '21-09-2026',
      document_remarks: '',
      tags: [],
      user_id: '7000477606',
    },
  }

  it('resolves when the server confirms status: true', async () => {
    postMock.mockResolvedValueOnce({ data: { status: true, message: 'Success. Document Saved.' } })
    await expect(uploadDocument(input)).resolves.toBeUndefined()
  })

  it('throws when the server returns HTTP 200 with status: false (confirmed live shape)', async () => {
    postMock.mockResolvedValueOnce({ data: { status: false, message: 'Invalid File.' } })
    await expect(uploadDocument(input)).rejects.toThrow('Invalid File.')
  })
})

describe('searchDocuments', () => {
  it('parses the confirmed live response shape, including recordsTotal', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        status: true,
        data: [{ document_id: 25, major_head: 'Professional', minor_head: 'IT', file_url: 'https://x/y.jpg' }],
        recordsTotal: 321,
        recordsFiltered: 1,
      },
    })
    const result = await searchDocuments({})
    expect(result.recordsTotal).toBe(321)
    expect(result.documents[0].fileUrl).toBe('https://x/y.jpg')
  })

  it('throws instead of silently returning zero results when status is false', async () => {
    postMock.mockResolvedValueOnce({ data: { status: false, message: 'Something went wrong.' } })
    await expect(searchDocuments({})).rejects.toThrow('Something went wrong.')
  })
})
