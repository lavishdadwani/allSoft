import { useQuery } from '@tanstack/react-query'
import { fetchDocumentTags } from '@/api/documents'
import { cacheTags, getCachedTags } from '@/lib/offlineCache'
import type { Tag } from '@/types/document'

export function useDocumentTags(term: string) {
  return useQuery<Tag[]>({
    queryKey: ['documentTags', term],
    queryFn: async () => {
      try {
        const tags = await fetchDocumentTags(term)
        void cacheTags(tags)
        return tags
      } catch (error) {
        const cached = await getCachedTags()
        if (cached) return cached
        throw error
      }
    },
    staleTime: 60_000,
  })
}
