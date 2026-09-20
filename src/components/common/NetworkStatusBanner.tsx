import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function NetworkStatusBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="bg-amber-500 text-amber-950 text-sm font-medium text-center py-1.5 px-4">
      You're offline. Showing the last cached results where available — new uploads and searches
      will resume once you're back online.
    </div>
  )
}
