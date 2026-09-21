import { describe, expect, it } from 'vitest'
import { normalizeDocumentEntry } from './normalize'

describe('normalizeDocumentEntry', () => {
  it('maps snake_case API fields to the DocumentEntry shape', () => {
    const entry = normalizeDocumentEntry({
      document_id: 42,
      major_head: 'Personal',
      minor_head: 'John',
      document_date: '12-02-2024',
      document_remarks: 'note',
      tags: [{ tag_name: 'RMC' }, 'legacy-string-tag'],
      uploaded_by: 'nitin',
      file_url: 'https://files.example.com/a/b/report.pdf',
    })

    expect(entry.id).toBe('42')
    expect(entry.majorHead).toBe('Personal')
    expect(entry.tags).toEqual(['RMC', 'legacy-string-tag'])
    expect(entry.fileName).toBe('report.pdf')
    expect(entry.uploadedBy).toBe('nitin')
  })

  it('falls back gracefully when fields are missing', () => {
    const entry = normalizeDocumentEntry({})
    expect(entry.fileUrl).toBe('')
    expect(entry.fileName).toBe('document')
    expect(entry.tags).toEqual([])
    expect(entry.id).toMatch(/^doc-/)
  })

  it('derives a file name from path when filename is absent', () => {
    const entry = normalizeDocumentEntry({ path: '/uploads/2024/invoice.png' })
    expect(entry.fileName).toBe('invoice.png')
  })

  it('strips the query string from a pre-signed S3 URL instead of treating it as part of the filename', () => {
    // Confirmed live shape — this is what broke preview file-type detection: a
    // naive split('/').pop() drags the entire ?X-Amz-... query string along with
    // it, so getFileKind() never matched a real extension.
    const entry = normalizeDocumentEntry({
      file_url:
        'https://allsoft-consulting.s3.ap-south-1.amazonaws.com/fileUploads/2024-02-26/4affc8c4-e241-4ed2-9bf2-370ccce4c398.jpg?X-Amz-Expires=1800&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAYDPL5BFOBQHG4D5W%2F20260921%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Signature=abc123',
    })
    expect(entry.fileName).toBe('4affc8c4-e241-4ed2-9bf2-370ccce4c398.jpg')
  })
})
