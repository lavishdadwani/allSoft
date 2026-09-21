import { useCallback, useEffect, useRef, useState } from 'react'
import { API_BASE_URL } from '@/api/client'
import { triggerBrowserDownload } from '@/lib/download'
import { getToken } from '@/lib/session'
import type { ZipWorkerFile, ZipWorkerRequest, ZipWorkerResponse } from '@/workers/zipWorker'

export interface ZipDownloadState {
  isZipping: boolean
  completed: number
  total: number
  error: string | null
  unauthorizedCount: number
  skippedCount: number
}

export function useZipDownload() {
  const workerRef = useRef<Worker | null>(null)
  const [state, setState] = useState<ZipDownloadState>({
    isZipping: false,
    completed: 0,
    total: 0,
    error: null,
    unauthorizedCount: 0,
    skippedCount: 0,
  })

  // If the component unmounts mid-zip (e.g. the user navigates away), stop the
  // worker instead of letting it keep fetching every remaining file in the
  // background for a download nobody will receive.
  useEffect(() => {
    return () => workerRef.current?.terminate()
  }, [])

  const downloadZip = useCallback((files: ZipWorkerFile[], zipFileName = 'documents.zip') => {
    if (files.length === 0) return

    workerRef.current?.terminate()
    const worker = new Worker(new URL('../workers/zipWorker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker

    setState({
      isZipping: true,
      completed: 0,
      total: files.length,
      error: null,
      unauthorizedCount: 0,
      skippedCount: 0,
    })

    worker.onmessage = (event: MessageEvent<ZipWorkerResponse>) => {
      const msg = event.data
      if (msg.type === 'progress') {
        setState((prev) => ({ ...prev, completed: msg.completed, total: msg.total }))
      } else if (msg.type === 'done') {
        triggerBrowserDownload(new Blob([msg.buffer], { type: 'application/zip' }), zipFileName)
        setState((prev) => ({
          ...prev,
          isZipping: false,
          unauthorizedCount: msg.unauthorizedCount,
          skippedCount: msg.skippedCount,
        }))
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

    const request: ZipWorkerRequest = { files, token: getToken(), apiOrigin: new URL(API_BASE_URL).origin }
    worker.postMessage(request)
  }, [])

  return { ...state, downloadZip }
}
