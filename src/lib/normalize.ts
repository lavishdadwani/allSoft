import type { DocumentEntry, DocumentEntryRaw } from '@/types/document'

let counter = 0

// The real API never returns a `filename` field (confirmed live), so the name is
// derived from the file URL — which is a pre-signed S3 URL with a long query
// string (?X-Amz-Signature=...). Naively splitting on '/' grabs the query string
// along with it, which broke file-type detection (getFileKind) for every single
// document, since ".jpg?X-Amz-..." never matches a known extension. Must use the
// URL's pathname only, not the full string.
function extractFileNameFromUrl(url: string): string | undefined {
  try {
    return new URL(url).pathname.split('/').pop() || undefined
  } catch {
    // Not a valid absolute URL (e.g. a bare relative path) — strip any query
    // string manually instead.
    return url.split('?')[0].split('/').pop() || undefined
  }
}

export function normalizeDocumentEntry(raw: DocumentEntryRaw): DocumentEntry {
  const fileUrl = raw.file_url ?? raw.path ?? raw.document_path ?? ''
  const fileName = raw.filename || (fileUrl ? extractFileNameFromUrl(fileUrl) : undefined) || 'document'
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
