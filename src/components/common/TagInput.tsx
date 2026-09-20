import { useEffect, useMemo, useState } from 'react'
import { useDocumentTags } from '@/hooks/useDocumentTags'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function TagInput({ value, onChange, placeholder = 'Add a tag and press Enter' }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedTerm(inputValue.trim()), 200)
    return () => clearTimeout(handle)
  }, [inputValue])

  const { data: suggestions = [], isLoading } = useDocumentTags(debouncedTerm)

  const filteredSuggestions = useMemo(
    () =>
      suggestions
        .map((s) => s.tag_name)
        .filter((name) => !value.includes(name))
        .filter((name) => name.toLowerCase().includes(inputValue.trim().toLowerCase()))
        .slice(0, 8),
    [suggestions, value, inputValue],
  )

  function addTag(raw: string) {
    const tag = raw.trim()
    if (!tag || value.includes(tag)) {
      setInputValue('')
      return
    }
    onChange([...value, tag])
    setInputValue('')
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 border border-slate-300 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 bg-white">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-brand-100 text-brand-800 text-xs font-medium px-2 py-1 rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-brand-950"
              aria-label={`Remove tag ${tag}`}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none text-sm py-0.5"
        />
      </div>

      {isFocused && (inputValue.length > 0 || filteredSuggestions.length > 0) && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-auto">
          {isLoading && <div className="px-3 py-2 text-xs text-slate-400">Loading tags…</div>}
          {!isLoading && filteredSuggestions.length === 0 && inputValue.trim() && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(inputValue)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50"
            >
              Create tag "{inputValue.trim()}"
            </button>
          )}
          {filteredSuggestions.map((name) => (
            <button
              type="button"
              key={name}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(name)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
