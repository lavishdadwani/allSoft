import { useCallback, useRef, useState } from 'react'
import { getToken } from '@/lib/session'
import type { ZipWorkerFile, ZipWorkerRequest, ZipWorkerResponse } from '@/workers/zipWorker'

export interface ZipDownloadState {
  isZipping: boolean
  completed: number
  total: number
  error: string | null
}

export function useZipDownload() {
  const workerRef = useRef<Worker | null>(null)
  const [state, setState] = useState<ZipDownloadState>({
    isZipping: false,
    completed: 0,
    total: 0,
    error: null,
  })

  const downloadZip = useCallback((files: ZipWorkerFile[], zipFileName = 'documents.zip') => {
    if (files.length === 0) return

    workerRef.current?.terminate()
    const worker = new Worker(new URL('../workers/zipWorker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker

    setState({ isZipping: true, completed: 0, total: files.length, error: null })

    worker.onmessage = (event: MessageEvent<ZipWorkerResponse>) => {
      const msg = event.data
      if (msg.type === 'progress') {
        setState((prev) => ({ ...prev, completed: msg.completed, total: msg.total }))
      } else if (msg.type === 'done') {
        const blob = new Blob([msg.buffer], { type: 'application/zip' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = zipFileName
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
        setState((prev) => ({ ...prev, isZipping: false }))
        worker.terminate()
      } else if (msg.type === 'error') {
        setState((prev) => ({ ...prev, isZipping: false, error: msg.message }))
        worker.terminate()
      }
    }

    worker.onerror = (event) => {
      setState((prev) => ({ ...prev, isZipping: false, error: event.message }))
      worker.terminate()
    }

    const request: ZipWorkerRequest = { files, token: getToken() }
    worker.postMessage(request)
  }, [])

  return { ...state, downloadZip }
}
