import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSearchDocuments } from '@/hooks/useSearchDocuments'
import { Spinner } from '@/components/common/Spinner'
import { EMPTY_SEARCH_FILTERS, SearchForm, type SearchFilterState } from '@/components/search/SearchForm'
import { ResultsList } from '@/components/search/ResultsList'
import { isoToApiDate } from '@/lib/date'
import type { SearchRequest } from '@/types/document'

// Fetched in one page and rendered with a virtualizer (see ResultsList), which is
// what lets 1000+ rows stay smooth without a traditional paging UI.
const PAGE_LENGTH = 2000

function toSearchRequest(filters: SearchFilterState, userId: string | null): Partial<SearchRequest> {
  return {
    major_head: filters.majorHead,
    minor_head: filters.minorHead,
    from_date: filters.fromDate ? isoToApiDate(filters.fromDate) : '',
    to_date: filters.toDate ? isoToApiDate(filters.toDate) : '',
    tags: filters.tags.map((tag_name) => ({ tag_name })),
    uploaded_by: userId ?? '',
    start: 0,
    length: PAGE_LENGTH,
    filterId: '',
    search: { value: filters.searchText },
  }
}

export function SearchPage() {
  const { userId } = useAuth()
  const [filters, setFilters] = useState<SearchFilterState>(EMPTY_SEARCH_FILTERS)
  const [submittedFilters, setSubmittedFilters] = useState<SearchFilterState | null>(null)

  const requestPayload = submittedFilters ? toSearchRequest(submittedFilters, userId) : {}
  const { result, isLoading, isError, isFromCache, cachedAt, refetch } = useSearchDocuments(
    requestPayload,
    submittedFilters !== null,
  )

  return (
    <div className="space-y-6">
      <SearchForm
        filters={filters}
        onChange={setFilters}
        onSubmit={() => setSubmittedFilters(filters)}
        onReset={() => {
          setFilters(EMPTY_SEARCH_FILTERS)
          setSubmittedFilters(null)
        }}
        isSearching={isLoading}
      />

      {isFromCache && result && (
        <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-3 py-2">
          Showing cached results from {cachedAt ? new Date(cachedAt).toLocaleString() : 'earlier'} — you're
          offline or the server is unreachable right now.
        </div>
      )}

      {submittedFilters === null && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center text-sm text-slate-500">
          Set your filters above and click Search to find documents.
        </div>
      )}

      {submittedFilters !== null && isLoading && <Spinner label="Searching documents…" />}

      {submittedFilters !== null && isError && !result && (
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6 text-sm text-red-700 flex items-center justify-between">
          <span>Something went wrong while searching, and no cached results were available.</span>
          <button onClick={() => refetch()} className="text-red-800 font-medium underline">
            Retry
          </button>
        </div>
      )}

      {result && (
        <>
          <p className="text-xs text-slate-500">
            Showing {result.documents.length} of {result.recordsFiltered} matching document(s).
          </p>
          <ResultsList documents={result.documents} />
        </>
      )}
    </div>
  )
}
