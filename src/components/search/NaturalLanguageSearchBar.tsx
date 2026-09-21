import { useState } from 'react'
import { parseNaturalLanguageQuery } from '@/lib/nlSearchParser'
import type { SearchFilterState } from '@/components/search/SearchForm'

interface NaturalLanguageSearchBarProps {
  onApply: (filters: Partial<SearchFilterState>) => void
}

const EXAMPLE = 'e.g. "Find HR files from last week" or "Personal photos tagged #invoice in March 2024"'

export function NaturalLanguageSearchBar({ onApply }: NaturalLanguageSearchBarProps) {
  const [query, setQuery] = useState('')
  const [matched, setMatched] = useState<string[] | null>(null)

  function handleParse() {
    if (!query.trim()) return
    const result = parseNaturalLanguageQuery(query)
    setMatched(result.matched)
    onApply(result.filters)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <label htmlFor="nl-search" className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
        Try natural language
        <span className="text-[10px] font-semibold uppercase tracking-wide bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded">
          Bonus
        </span>
      </label>
      <div className="flex gap-2">
        <input
          id="nl-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleParse()
            }
          }}
          placeholder={EXAMPLE}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
        <button
          type="button"
          onClick={handleParse}
          disabled={!query.trim()}
          className="bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Parse
        </button>
      </div>

      {matched && (
        <div className="mt-2 text-xs text-slate-500">
          {matched.length > 0 ? (
            <>
              Understood: <span className="text-slate-700">{matched.join(' · ')}</span> — filters below were
              filled in; review and hit Search.
            </>
          ) : (
            "Couldn't pick out any category, date, or tag — try rephrasing, or just use the filters below."
          )}
        </div>
      )}
    </div>
  )
}
