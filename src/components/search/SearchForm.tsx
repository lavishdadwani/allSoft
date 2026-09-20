import { useMemo } from 'react'
import { TagInput } from '@/components/common/TagInput'
import { MAJOR_HEADS, minorHeadOptions, type MajorHead } from '@/types/document'

export interface SearchFilterState {
  majorHead: MajorHead | ''
  minorHead: string
  tags: string[]
  fromDate: string
  toDate: string
  searchText: string
}

export const EMPTY_SEARCH_FILTERS: SearchFilterState = {
  majorHead: '',
  minorHead: '',
  tags: [],
  fromDate: '',
  toDate: '',
  searchText: '',
}

interface SearchFormProps {
  filters: SearchFilterState
  onChange: (filters: SearchFilterState) => void
  onSubmit: () => void
  onReset: () => void
  isSearching: boolean
}

export function SearchForm({ filters, onChange, onSubmit, onReset, isSearching }: SearchFormProps) {
  const minorOptions = useMemo(() => minorHeadOptions(filters.majorHead), [filters.majorHead])

  function update<K extends keyof SearchFilterState>(key: K, value: SearchFilterState[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4"
    >
      <h2 className="text-lg font-semibold text-slate-900">Search documents</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <select
            value={filters.majorHead}
            onChange={(e) => {
              update('majorHead', e.target.value as MajorHead)
              update('minorHead', '')
            }}
            className={selectClass}
          >
            <option value="">All categories</option>
            {MAJOR_HEADS.map((head) => (
              <option key={head} value={head}>
                {head}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {filters.majorHead === 'Professional' ? 'Department' : 'Name'}
          </label>
          <select
            value={filters.minorHead}
            onChange={(e) => update('minorHead', e.target.value)}
            disabled={!filters.majorHead}
            className={selectClass}
          >
            <option value="">All</option>
            {minorOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">From date</label>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => update('fromDate', e.target.value)}
            className={selectClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">To date</label>
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => update('toDate', e.target.value)}
            className={selectClass}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
          <TagInput value={filters.tags} onChange={(tags) => update('tags', tags)} placeholder="Filter by tag" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Free text search</label>
          <input
            type="text"
            value={filters.searchText}
            onChange={(e) => update('searchText', e.target.value)}
            placeholder="Search remarks, filenames…"
            className={selectClass}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSearching}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          {isSearching ? 'Searching…' : 'Search'}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="text-slate-600 hover:text-slate-900 text-sm font-medium px-3 py-2.5"
        >
          Clear filters
        </button>
      </div>
    </form>
  )
}

const selectClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
