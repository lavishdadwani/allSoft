import { useQuery } from '@tanstack/react-query'
import { RECENT_UPLOADS_KEY, type RecentUpload } from '@/hooks/useUploadDocument'

// The recent-uploads list is never fetched from the server — it only exists as
// mutation-driven cache state (see useUploadDocument's onMutate/onSuccess/onError).
// Subscribing via useQuery (instead of a one-off queryClient.getQueryData call) is
// what makes components re-render when that cache is updated.
export function useRecentUploads(): RecentUpload[] {
  const { data } = useQuery<RecentUpload[]>({
    queryKey: RECENT_UPLOADS_KEY,
    queryFn: () => Promise.resolve([]),
    initialData: [],
    staleTime: Infinity,
    // DashboardPage unmounts UploadForm whenever the user switches to the Search
    // tab. Without pinning gcTime, react-query would garbage-collect this
    // observer-less cache entry after the default 5 minutes and silently reset
    // the list to [] the next time the Upload tab is revisited.
    gcTime: Infinity,
  })
  return data
}
