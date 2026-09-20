import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadDocument, type UploadDocumentInput } from '@/api/documents'

export interface RecentUpload {
  clientId: string
  fileName: string
  majorHead: string
  minorHead: string
  tags: string[]
  status: 'pending' | 'success' | 'error'
}

export const RECENT_UPLOADS_KEY = ['recentUploads'] as const

export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UploadDocumentInput) => uploadDocument(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: RECENT_UPLOADS_KEY })
      const previous = queryClient.getQueryData<RecentUpload[]>(RECENT_UPLOADS_KEY) ?? []

      const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const optimisticEntry: RecentUpload = {
        clientId,
        fileName: input.file.name,
        majorHead: input.meta.major_head,
        minorHead: input.meta.minor_head,
        tags: input.meta.tags.map((t) => t.tag_name),
        status: 'pending',
      }

      queryClient.setQueryData<RecentUpload[]>(RECENT_UPLOADS_KEY, [optimisticEntry, ...previous])

      return { previous, clientId }
    },

    onError: (_error, _input, context) => {
      // Roll back: the optimistic entry never happened.
      if (context) {
        queryClient.setQueryData<RecentUpload[]>(RECENT_UPLOADS_KEY, context.previous)
      }
    },

    onSuccess: (_data, _input, context) => {
      if (!context) return
      queryClient.setQueryData<RecentUpload[]>(RECENT_UPLOADS_KEY, (current = []) =>
        current.map((entry) => (entry.clientId === context.clientId ? { ...entry, status: 'success' } : entry)),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['searchDocuments'] })
    },
  })
}
