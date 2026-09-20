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

export async function downloadFile(url: string, fileName: string): Promise<void> {
  const blob = await fetchFileBlob(url)
  triggerBrowserDownload(blob, fileName)
}
