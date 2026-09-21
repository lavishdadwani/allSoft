import { describe, expect, it } from 'vitest'
import { tokensFrom } from './autoTagWorker'

describe('tokensFrom (mock auto-tagging heuristic)', () => {
  it('extracts meaningful tokens from a filename, stripping the extension', () => {
    expect(tokensFrom('invoice_march_2024.pdf')).toEqual(['invoice', 'march'])
  })

  it('drops stopwords and pure numbers', () => {
    expect(tokensFrom('final_scan_copy_2024.png')).toEqual([])
  })

  it('lowercases everything', () => {
    expect(tokensFrom('QUARTERLY-Budget.pdf')).toEqual(['quarterly', 'budget'])
  })
})
