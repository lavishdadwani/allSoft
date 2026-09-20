import { apiClient } from '@/api/client'
import { normalizeDocumentEntry } from '@/lib/normalize'
import {
  searchRequestSchema,
  searchResponseSchema,
  tagSchema,
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
  await apiClient.post('/saveDocumentEntry', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export interface SearchResult {
  documents: DocumentEntry[]
  recordsTotal: number
  recordsFiltered: number
}

export async function searchDocuments(filters: Partial<SearchRequest>): Promise<SearchResult> {
  const payload = searchRequestSchema.parse(filters)
  const { data } = await apiClient.post('/searchDocumentEntry', payload)
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
    data: z.array(z.union([tagSchema, z.string()])).default([]),
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

  return parsed.data.data.map((t) => (typeof t === 'string' ? { tag_name: t } : t))
}
