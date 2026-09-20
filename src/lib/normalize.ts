import type { DocumentEntry, DocumentEntryRaw } from '@/types/document'

let counter = 0

export function normalizeDocumentEntry(raw: DocumentEntryRaw): DocumentEntry {
  const fileUrl = raw.file_url ?? raw.path ?? raw.document_path ?? ''
  const fileName = raw.filename ?? fileUrl.split('/').pop() ?? 'document'
  const tags = (raw.tags ?? []).map((t) => (typeof t === 'string' ? t : t.tag_name))

  return {
    id: raw.document_id != null ? String(raw.document_id) : `doc-${Date.now()}-${counter++}`,
    majorHead: raw.major_head ?? '',
    minorHead: raw.minor_head ?? '',
    documentDate: raw.document_date ?? raw.created_on ?? '',
    remarks: raw.document_remarks ?? '',
    tags,
    uploadedBy: raw.uploaded_by ?? raw.user_id ?? '',
    fileUrl,
    fileName,
  }
}
