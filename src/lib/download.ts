import { apiClient } from '@/api/client'

export async function fetchFileBlob(url: string): Promise<Blob> {
  const response = await apiClient.get<Blob>(url, { responseType: 'blob' })
  return response.data
}

export function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const blobUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(blobUrl)
}

export type DownloadOutcome = 'saved' | 'opened-new-tab'

export async function downloadFile(url: string, fileName: string): Promise<DownloadOutcome> {
  try {
    const blob = await fetchFileBlob(url)
    triggerBrowserDownload(blob, fileName)
    return 'saved'
  } catch {
    // Most likely cause (confirmed against the real backend): the file lives on
    // an S3 bucket with no CORS configuration, so the browser blocks JS from
    // reading the response body even though the URL itself loads fine as a plain
    // resource. Open it in a new tab so the user has a path to save it manually
    // instead of the download silently failing.
    window.open(url, '_blank', 'noopener')
    return 'opened-new-tab'
  }
}
