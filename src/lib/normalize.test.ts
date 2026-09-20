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
})
