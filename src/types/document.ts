import { z } from 'zod'

export const MAJOR_HEADS = ['Personal', 'Professional'] as const
export type MajorHead = (typeof MAJOR_HEADS)[number]

export const PERSONAL_NAMES = ['John', 'Tom', 'Emily', 'Sara', 'Alex'] as const
export const PROFESSIONAL_DEPARTMENTS = ['Accounts', 'HR', 'IT', 'Finance', 'Marketing'] as const

export function minorHeadOptions(majorHead: MajorHead | ''): readonly string[] {
  if (majorHead === 'Personal') return PERSONAL_NAMES
  if (majorHead === 'Professional') return PROFESSIONAL_DEPARTMENTS
  return []
}

export const tagSchema = z.object({
  tag_name: z.string().min(1, 'Tag cannot be empty'),
})
export type Tag = z.infer<typeof tagSchema>

// documentTags suggestions come back shaped like { id, label } (confirmed live:
// {"data": [{"id": "Assignment", "label": "Assignment"}], "status": true}) — a
// different shape than the { tag_name } the rest of the API (saveDocumentEntry,
// searchDocumentEntry) uses for tags. This normalizes any of the shapes we might
// plausibly see down to a plain tag-name string.
export const tagSuggestionSchema = z.union([
  z.object({ tag_name: z.string().min(1) }).transform((t) => t.tag_name),
  z.object({ label: z.string().min(1), id: z.union([z.string(), z.number()]).optional() }).transform(
    (t) => t.label,
  ),
  z.string().min(1),
])

// Validates the upload form before it is turned into the multipart "data" payload.
export const uploadFormSchema = z.object({
  major_head: z.enum(MAJOR_HEADS, { message: 'Select a category' }),
  minor_head: z.string().min(1, 'Select a name/department'),
  document_date: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}$/, 'Date must be in DD-MM-YYYY format'),
  document_remarks: z.string().max(500, 'Remarks are too long').default(''),
  tags: z.array(tagSchema).default([]),
  user_id: z.string().min(1, 'Missing user id'),
})
export type UploadFormValues = z.infer<typeof uploadFormSchema>

export const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export const uploadFileSchema = z
  .instanceof(File, { message: 'A file is required' })
  .refine((file) => ACCEPTED_FILE_TYPES.includes(file.type), {
    message: 'Only image (PNG/JPG/WEBP) and PDF files are allowed',
  })
  .refine((file) => file.size <= MAX_FILE_SIZE_BYTES, {
    message: 'File must be 10MB or smaller',
  })

// Request payload validation for the search endpoint.
export const searchRequestSchema = z.object({
  major_head: z.string().default(''),
  minor_head: z.string().default(''),
  from_date: z.string().default(''),
  to_date: z.string().default(''),
  tags: z.array(tagSchema).default([]),
  uploaded_by: z.string().default(''),
  start: z.number().int().nonnegative().default(0),
  length: z.number().int().positive().default(10),
  filterId: z.string().default(''),
  search: z.object({ value: z.string().default('') }).default({ value: '' }),
})
export type SearchRequest = z.infer<typeof searchRequestSchema>

// Response validation is intentionally lenient: we trust our own request shape but
// only *cross-check* the server's response, falling back gracefully on drift instead
// of crashing the UI (see src/lib/parse.ts).
export const documentEntrySchema = z
  .object({
    document_id: z.union([z.string(), z.number()]).optional(),
    major_head: z.string().optional(),
    minor_head: z.string().optional(),
    document_date: z.string().optional(),
    document_remarks: z.string().optional(),
    tags: z.array(z.union([tagSchema, z.string()])).optional().default([]),
    uploaded_by: z.string().optional(),
    user_id: z.string().optional(),
    file_url: z.string().optional(),
    path: z.string().optional(),
    document_path: z.string().optional(),
    filename: z.string().optional(),
    created_on: z.string().optional(),
  })
  .passthrough()
export type DocumentEntryRaw = z.input<typeof documentEntrySchema>

export interface DocumentEntry {
  id: string
  majorHead: string
  minorHead: string
  documentDate: string
  remarks: string
  tags: string[]
  uploadedBy: string
  fileUrl: string
  fileName: string
}

export const searchResponseSchema = z
  .object({
    data: z.array(documentEntrySchema).default([]),
    recordsTotal: z.number().optional(),
    recordsFiltered: z.number().optional(),
    status: z.union([z.string(), z.number(), z.boolean()]).optional(),
    message: z.string().optional(),
  })
  .passthrough()
