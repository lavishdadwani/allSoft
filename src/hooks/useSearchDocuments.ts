import { useQuery } from '@tanstack/react-query'
import { searchDocuments, type SearchResult } from '@/api/documents'
import { cacheSearchResult, getCachedSearchResult, makeSearchCacheKey } from '@/lib/offlineCache'
import type { SearchRequest } from '@/types/document'

export interface UseSearchDocumentsResult {
  result: SearchResult | undefined
  isLoading: boolean
  isError: boolean
  isFromCache: boolean
  cachedAt: number | null
  refetch: () => void
  error: unknown
}

export function useSearchDocuments(filters: Partial<SearchRequest>, enabled: boolean) {
  const cacheKey = makeSearchCacheKey(filters)

  const query = useQuery<{ result: SearchResult; isFromCache: boolean; cachedAt: number | null }>({
    queryKey: ['searchDocuments', filters],
    enabled,
    queryFn: async () => {
      try {
        const result = await searchDocuments(filters)
        void cacheSearchResult(cacheKey, result)
        return { result, isFromCache: false, cachedAt: null }
      } catch (error) {
        const cached = await getCachedSearchResult(cacheKey)
        if (cached) {
          return { result: cached.result, isFromCache: true, cachedAt: cached.cachedAt }
        }
        throw error
      }
    },
  })

  return {
    result: query.data?.result,
    isLoading: query.isLoading,
    isError: query.isError,
    isFromCache: query.data?.isFromCache ?? false,
    cachedAt: query.data?.cachedAt ?? null,
    refetch: query.refetch,
    error: query.error,
  }
}
