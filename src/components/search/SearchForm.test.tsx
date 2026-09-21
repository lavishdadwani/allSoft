import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { EMPTY_SEARCH_FILTERS, SearchForm } from './SearchForm'

describe('SearchForm', () => {
  it('keeps the category selection instead of discarding it (regression)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <SearchForm
          filters={EMPTY_SEARCH_FILTERS}
          onChange={onChange}
          onSubmit={vi.fn()}
          onReset={vi.fn()}
          isSearching={false}
        />
      </QueryClientProvider>,
    )

    await user.selectOptions(screen.getByLabelText(/category/i), 'Personal')
    
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ majorHead: 'Personal', minorHead: '' }),
    )
    expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({ majorHead: '' }))
  })
})
