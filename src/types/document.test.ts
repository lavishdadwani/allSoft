import { describe, expect, it } from 'vitest'
import { minorHeadOptions, searchRequestSchema, tagSuggestionSchema, uploadFormSchema } from './document'

describe('minorHeadOptions', () => {
  it('returns names for Personal', () => {
    expect(minorHeadOptions('Personal')).toContain('John')
  })

  it('returns departments for Professional', () => {
    expect(minorHeadOptions('Professional')).toContain('HR')
  })

  it('returns empty list when unset', () => {
    expect(minorHeadOptions('')).toEqual([])
  })
})

describe('uploadFormSchema', () => {
  const base = {
    major_head: 'Personal' as const,
    minor_head: 'John',
    document_date: '12-02-2024',
    document_remarks: 'Test remarks',
    tags: [{ tag_name: 'RMC' }],
    user_id: 'nitin',
  }

  it('accepts a valid payload', () => {
    expect(uploadFormSchema.safeParse(base).success).toBe(true)
  })

  it('rejects an invalid date format', () => {
    const result = uploadFormSchema.safeParse({ ...base, document_date: '2024-02-12' })
    expect(result.success).toBe(false)
  })

  it('rejects a missing minor_head', () => {
    const result = uploadFormSchema.safeParse({ ...base, minor_head: '' })
    expect(result.success).toBe(false)
  })

  it('defaults tags and remarks when omitted', () => {
    const { tags: _tags, document_remarks: _remarks, ...rest } = base
    const result = uploadFormSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tags).toEqual([])
      expect(result.data.document_remarks).toBe('')
    }
  })
})

describe('searchRequestSchema', () => {
  it('fills in defaults for an empty filter object', () => {
    const result = searchRequestSchema.parse({})
    expect(result.start).toBe(0)
    expect(result.length).toBe(10)
    expect(result.search.value).toBe('')
  })
})

describe('tagSuggestionSchema', () => {
  it('extracts the name from the real documentTags shape ({id, label})', () => {
    // Confirmed live: {"data": [{"id": "Assignment", "label": "Assignment"}], "status": true}
    expect(tagSuggestionSchema.parse({ id: 'Assignment', label: 'Assignment' })).toBe('Assignment')
  })

  it('still accepts a { tag_name } object', () => {
    expect(tagSuggestionSchema.parse({ tag_name: 'RMC' })).toBe('RMC')
  })

  it('still accepts a bare string', () => {
    expect(tagSuggestionSchema.parse('work_order')).toBe('work_order')
  })

  it('rejects a shape with none of the recognized fields', () => {
    expect(tagSuggestionSchema.safeParse({ foo: 'bar' }).success).toBe(false)
  })
})
