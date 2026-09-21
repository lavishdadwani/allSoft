import { useEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useZipDownload } from '@/hooks/useZipDownload'
import { downloadFile } from '@/lib/download'
import type { DocumentEntry } from '@/types/document'
import { PreviewModal } from '@/components/search/PreviewModal'

interface ResultsListProps {
  documents: DocumentEntry[]
}

const ROW_HEIGHT = 72

export function ResultsList({ documents }: ResultsListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [previewDoc, setPreviewDoc] = useState<DocumentEntry | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const { showToast } = useToast()
  const { logout } = useAuth()
  const zip = useZipDownload()

  // The ZIP worker fetches files independently of apiClient, so a 401 there
  // doesn't automatically trigger the app-wide session-expired handling — do it
  // explicitly here instead of silently shipping a ZIP with files missing.
  useEffect(() => {
    if (zip.unauthorizedCount > 0) {
      showToast('Your session has expired. Please log in again.', 'error')
      logout()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zip.unauthorizedCount])

  useEffect(() => {
    if (zip.error) showToast(zip.error, 'error')
  }, [zip.error, showToast])

  useEffect(() => {
    if (zip.skippedCount > 0 && zip.unauthorizedCount === 0) {
      showToast(
        `${zip.skippedCount} file(s) couldn't be bundled and were skipped — the rest downloaded fine.`,
        'info',
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zip.skippedCount])

  const virtualizer = useVirtualizer({
    count: documents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  })

  const allSelected = documents.length > 0 && selected.size === documents.length

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(documents.map((d) => d.id)))
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleDownloadOne(doc: DocumentEntry) {
    if (!doc.fileUrl) {
      showToast('No file URL available for this document.', 'error')
      return
    }
    setDownloadingId(doc.id)
    try {
      const outcome = await downloadFile(doc.fileUrl, doc.fileName)
      if (outcome === 'opened-new-tab') {
        showToast(`Opened ${doc.fileName} in a new tab — save it from there.`, 'info')
      }
    } catch {
      showToast(`Failed to download ${doc.fileName}.`, 'error')
    } finally {
      setDownloadingId(null)
    }
  }

  function handleDownloadZip() {
    const targets = documents.filter((d) => selected.size === 0 || selected.has(d.id))
    const files = targets.filter((d) => d.fileUrl).map((d) => ({ name: d.fileName, url: d.fileUrl }))
    if (files.length === 0) {
      showToast('No files available to zip.', 'error')
      return
    }
    zip.downloadZip(files, 'documents.zip')
  }

  const selectionLabel =
    selected.size === 0
      ? `Download all (${documents.length}) as ZIP`
      : `Download selected (${selected.size}) as ZIP`

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center text-sm text-slate-500">
        No documents found. Try adjusting your search filters.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
          Select all ({documents.length} results)
        </label>
        <button
          onClick={handleDownloadZip}
          disabled={zip.isZipping}
          className="bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {zip.isZipping ? `Zipping ${zip.completed}/${zip.total}…` : selectionLabel}
        </button>
      </div>

      <div ref={parentRef} className="max-h-[520px] overflow-auto">
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const doc = documents[virtualRow.index]
            return (
              <div
                key={doc.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="flex items-center gap-3 px-5 border-b border-slate-50 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(doc.id)}
                  onChange={() => toggleOne(doc.id)}
                  className="rounded shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{doc.fileName}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {doc.majorHead || '—'} · {doc.minorHead || '—'} · {doc.documentDate || 'no date'}
                    {doc.tags.length > 0 && <> · #{doc.tags.join(' #')}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="text-xs font-medium text-brand-700 hover:text-brand-900 px-2.5 py-1.5 rounded-lg hover:bg-brand-50"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleDownloadOne(doc)}
                    disabled={downloadingId === doc.id}
                    className="text-xs font-medium text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-60"
                  >
                    {downloadingId === doc.id ? 'Downloading…' : 'Download'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {previewDoc && <PreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </div>
  )
}
