import { apiClient } from '@/api/client'

export async function downloadFile(url: string, fileName: string): Promise<void> {
  const response = await apiClient.get(url, { responseType: 'blob' })
  const blobUrl = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(blobUrl)
}
