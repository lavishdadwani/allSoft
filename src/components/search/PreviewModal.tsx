import { useEffect } from 'react'
import type { DocumentEntry } from '@/types/document'

interface PreviewModalProps {
  document: DocumentEntry
  onClose: () => void
}

function getFileKind(fileName: string): 'pdf' | 'image' | 'other' {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return 'pdf'
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'image'
  return 'other'
}

export function PreviewModal({ document: doc, onClose }: PreviewModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const kind = getFileKind(doc.fileName)

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 truncate">{doc.fileName}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center p-4">
          {kind === 'pdf' && doc.fileUrl && (
            <iframe src={doc.fileUrl} title={doc.fileName} className="w-full h-[65vh] rounded-lg bg-white" />
          )}
          {kind === 'image' && doc.fileUrl && (
            <img src={doc.fileUrl} alt={doc.fileName} className="max-h-[65vh] object-contain rounded-lg" />
          )}
          {(kind === 'other' || !doc.fileUrl) && (
            <p className="text-sm text-slate-500 text-center max-w-sm">
              Preview isn't supported for this file type. Use the download button to view it locally.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
