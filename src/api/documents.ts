import { apiClient } from '@/api/client'
import { assertEnvelopeSuccess, getEnvelopeErrorMessage, isSuccessStatus } from '@/lib/apiEnvelope'
import { normalizeDocumentEntry } from '@/lib/normalize'
import {
  searchRequestSchema,
  searchResponseSchema,
  tagSuggestionSchema,
  uploadFormSchema,
  type DocumentEntry,
  type SearchRequest,
  type Tag,
  type UploadFormValues,
} from '@/types/document'
import { z } from 'zod'

export interface UploadDocumentInput {
  file: File
  meta: UploadFormValues
}

export async function uploadDocument({ file, meta }: UploadDocumentInput): Promise<void> {
  const validated = uploadFormSchema.parse(meta)
  const formData = new FormData()
  formData.append('file', file)
  formData.append('data', JSON.stringify(validated))
  const { data } = await apiClient.post('/saveDocumentEntry', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  // Confirmed live: this returns HTTP 200 even on failure, e.g.
  // {"status": false, "message": "Invalid File."} — axios won't throw on its own.
  assertEnvelopeSuccess(data, 'Upload failed. Please try again.')
}

export interface SearchResult {
  documents: DocumentEntry[]
  recordsTotal: number
  recordsFiltered: number
}

export async function searchDocuments(filters: Partial<SearchRequest>): Promise<SearchResult> {
  const payload = searchRequestSchema.parse(filters)
  const { data } = await apiClient.post('/searchDocumentEntry', payload)

  // Same envelope as every other endpoint here: HTTP 200 even on failure. Without
  // this check, a real search error would render identically to "no matching
  // documents" — misleading the user into thinking their filters just don't match
  // anything.
  const status = (data as { status?: unknown } | undefined)?.status
  if (!isSuccessStatus(status)) {
    throw new Error(getEnvelopeErrorMessage(data, 'Search failed. Please try again.'))
  }

  const parsed = searchResponseSchema.safeParse(data)

  if (!parsed.success) {
    console.warn('searchDocumentEntry: response did not match expected shape', parsed.error.flatten())
    return { documents: [], recordsTotal: 0, recordsFiltered: 0 }
  }

  const documents = parsed.data.data.map(normalizeDocumentEntry)
  return {
    documents,
    recordsTotal: parsed.data.recordsTotal ?? documents.length,
    recordsFiltered: parsed.data.recordsFiltered ?? documents.length,
  }
}

const tagListResponseSchema = z
  .object({
    data: z.array(tagSuggestionSchema).default([]),
  })
  .passthrough()

export async function fetchDocumentTags(term: string): Promise<Tag[]> {
  const { data } = await apiClient.post('/documentTags', { term })

  // The API may return either { data: [...] } or a bare array; handle both.
  const candidate = Array.isArray(data) ? { data } : data
  const parsed = tagListResponseSchema.safeParse(candidate)
  if (!parsed.success) {
    console.warn('documentTags: response did not match expected shape', parsed.error.flatten())
    return []
  }

  return parsed.data.data.map((tag_name) => ({ tag_name }))
}
