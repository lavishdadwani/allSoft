import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { RECENT_UPLOADS_KEY, useUploadDocument, type RecentUpload } from './useUploadDocument'

vi.mock('@/api/documents', () => ({
  uploadDocument: vi.fn().mockRejectedValue(new Error('network down')),
}))

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useUploadDocument', () => {
  it('keeps a failed optimistic entry visible marked as errored, instead of deleting it', async () => {
    const queryClient = new QueryClient()
    const { result } = renderHook(() => useUploadDocument(), { wrapper: makeWrapper(queryClient) })

    result.current.mutate({
      file: new File(['x'], 'report.pdf', { type: 'application/pdf' }),
      meta: {
        major_head: 'Personal',
        minor_head: 'John',
        document_date: '01-01-2024',
        document_remarks: '',
        tags: [],
        user_id: 'nitin',
      },
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const uploads = queryClient.getQueryData<RecentUpload[]>(RECENT_UPLOADS_KEY)
    expect(uploads).toHaveLength(1)
    expect(uploads?.[0].status).toBe('error')
    expect(uploads?.[0].fileName).toBe('report.pdf')
  })
})
