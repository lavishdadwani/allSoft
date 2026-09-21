import { useCallback, useEffect, useRef, useState } from 'react'
import type { AutoTagRequest, AutoTagResponse } from '@/workers/autoTagWorker'

export function useAutoTagSuggestions() {
  const workerRef = useRef<Worker | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isSuggesting, setIsSuggesting] = useState(false)

  useEffect(() => {
    return () => workerRef.current?.terminate()
  }, [])

  const requestSuggestions = useCallback((input: AutoTagRequest) => {
    workerRef.current?.terminate()
    const worker = new Worker(new URL('../workers/autoTagWorker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker

    setIsSuggesting(true)
    setSuggestions([])

    worker.onmessage = (event: MessageEvent<AutoTagResponse>) => {
      setSuggestions(event.data.tags)
      setIsSuggesting(false)
      worker.terminate()
    }
    worker.onerror = () => {
      setIsSuggesting(false)
      worker.terminate()
    }

    worker.postMessage(input)
  }, [])

  const clearSuggestions = useCallback(() => {
    workerRef.current?.terminate()
    setIsSuggesting(false)
    setSuggestions([])
  }, [])

  return { suggestions, isSuggesting, requestSuggestions, clearSuggestions }
}
