import { createContext, useCallback, useState, type ReactNode } from 'react'

export interface Toast {
  id: number
  message: string
  variant: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  toasts: Toast[]
  showToast: (message: string, variant?: Toast['variant']) => void
  dismissToast: (id: number) => void
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined)

let idCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, variant: Toast['variant'] = 'info') => {
      const id = idCounter++
      setToasts((prev) => [...prev, { id, message, variant }])
      setTimeout(() => dismissToast(id), 4000)
    },
    [dismissToast],
  )

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>{children}</ToastContext.Provider>
  )
}
