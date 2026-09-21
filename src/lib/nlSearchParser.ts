import * as chrono from 'chrono-node'
import type { SearchFilterState } from '@/components/search/SearchForm'
import { PERSONAL_NAMES, PROFESSIONAL_DEPARTMENTS } from '@/types/document'

export interface NlParseResult {
  filters: Partial<SearchFilterState>
  // Human-readable summary of what was understood, shown back to the user so a
  // keyword-based parser's guesses stay reviewable rather than a silent black box.
  matched: string[]
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function extractWordMatch(text: string, candidates: readonly string[]): string | undefined {
  for (const candidate of candidates) {
    const pattern = new RegExp(`\\b${candidate}\\b`, 'i')
    if (pattern.test(text)) return candidate
  }
  return undefined
}

function extractTagHints(text: string): string[] {
  const hashtags = [...text.matchAll(/#(\w+)/g)].map((m) => m[1])
  const taggedAs = [...text.matchAll(/tagg?ed\s+(?:as|with)\s+["']?([\w-]+)["']?/gi)].map((m) => m[1])
  return [...new Set([...hashtags, ...taggedAs])]
}

/**
 * Parses a plain-English query like "Find HR files uploaded last week" into
 * structured search filters. This runs entirely client-side (chrono-node for
 * dates, keyword matching against the app's known categories/departments/names
 * for everything else) — no LLM endpoint, no API key to manage.
 */
export function parseNaturalLanguageQuery(query: string): NlParseResult {
  const matched: string[] = []
  let remaining = query

  // 1. Dates ("last week", "yesterday", "between Jan 1 and Jan 31", "in Feb 2024")
  const dateResults = chrono.parse(query)
  let fromDate: string | undefined
  let toDate: string | undefined
  for (const result of dateResults) {
    const start = toIsoDate(result.start.date())
    const end = result.end ? toIsoDate(result.end.date()) : start
    fromDate = fromDate ? (start < fromDate ? start : fromDate) : start
    toDate = toDate ? (end > toDate ? end : toDate) : end
    remaining = remaining.replace(result.text, ' ')
    matched.push(`date: "${result.text.trim()}" → ${start}${end !== start ? ` .. ${end}` : ''}`)
  }

  // 2. Category (Personal / Professional)
  let majorHead: SearchFilterState['majorHead'] = ''
  if (/\bprofessional\b/i.test(remaining)) {
    majorHead = 'Professional'
    remaining = remaining.replace(/\bprofessional\b/gi, ' ')
    matched.push('category: Professional')
  } else if (/\bpersonal\b/i.test(remaining)) {
    majorHead = 'Personal'
    remaining = remaining.replace(/\bpersonal\b/gi, ' ')
    matched.push('category: Personal')
  }

  // 3. Department (implies Professional) or Name (implies Personal)
  let minorHead = ''
  const department = extractWordMatch(remaining, PROFESSIONAL_DEPARTMENTS)
  if (department) {
    minorHead = department
    majorHead = 'Professional'
    remaining = remaining.replace(new RegExp(`\\b${department}\\b`, 'i'), ' ')
    matched.push(`department: ${department}`)
  } else {
    const name = extractWordMatch(remaining, PERSONAL_NAMES)
    if (name) {
      minorHead = name
      majorHead = 'Personal'
      remaining = remaining.replace(new RegExp(`\\b${name}\\b`, 'i'), ' ')
      matched.push(`name: ${name}`)
    }
  }

  // 4. Explicit tag hints (#tag, "tagged as X")
  const tags = extractTagHints(remaining)
  if (tags.length > 0) {
    remaining = remaining.replace(/#\w+/g, ' ').replace(/tagg?ed\s+(?:as|with)\s+["']?[\w-]+["']?/gi, ' ')
    matched.push(`tags: ${tags.join(', ')}`)
  }

  // 5. Whatever's left (minus filler words) becomes the free-text search.
  const searchText = remaining
    .replace(/\b(find|show|search|for|files?|documents?|uploaded|upload|with|by)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return {
    filters: {
      majorHead,
      minorHead,
      tags,
      fromDate: fromDate ?? '',
      toDate: toDate ?? '',
      searchText,
    },
    matched,
  }
}
