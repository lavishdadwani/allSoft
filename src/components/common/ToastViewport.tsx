import { useToast } from '@/hooks/useToast'

const VARIANT_STYLES: Record<string, string> = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-slate-800',
}

export function ToastViewport() {
  const { toasts, dismissToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[min(90vw,360px)]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`${VARIANT_STYLES[toast.variant]} text-white text-sm rounded-lg shadow-lg px-4 py-3 flex items-start justify-between gap-3`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => dismissToast(toast.id)}
            className="opacity-70 hover:opacity-100"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
