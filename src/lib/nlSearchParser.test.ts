import { describe, expect, it } from 'vitest'
import { parseNaturalLanguageQuery } from './nlSearchParser'

describe('parseNaturalLanguageQuery', () => {
  it('extracts a department (implying Professional) and a relative date range', () => {
    const { filters } = parseNaturalLanguageQuery('Find HR files uploaded last week')
    expect(filters.majorHead).toBe('Professional')
    expect(filters.minorHead).toBe('HR')
    expect(filters.fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(filters.toDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('extracts a name (implying Personal), hashtag tags, and an absolute date', () => {
    const { filters } = parseNaturalLanguageQuery('Personal photos from John tagged #invoice in March 2024')
    expect(filters.majorHead).toBe('Personal')
    expect(filters.minorHead).toBe('John')
    expect(filters.tags).toEqual(['invoice'])
    // chrono-node interprets a bare "month year" phrase as a single point in
    // time (the 1st), not an implicit whole-month range.
    expect(filters.fromDate).toBe('2024-03-01')
    expect(filters.toDate).toBe('2024-03-01')
  })

  it('falls back to free-text search when nothing structured is recognized', () => {
    const { filters, matched } = parseNaturalLanguageQuery('quarterly budget report')
    expect(matched).toEqual([])
    expect(filters.searchText).toContain('quarterly')
    expect(filters.majorHead).toBe('')
  })

  it('recognizes an explicit category keyword even without a department/name', () => {
    const { filters } = parseNaturalLanguageQuery('any professional documents')
    expect(filters.majorHead).toBe('Professional')
  })
})
