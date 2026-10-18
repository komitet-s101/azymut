import { useState, type FormEvent } from 'react'
import { Search, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { appLayout } from '@/lib/appLayout'
import { cn } from '@/lib/utils'

const PLACEHOLDER = 'Opisz, jak chcesz spędzić czas…'
const SEARCH_LABEL = 'Wyszukiwanie planu w języku naturalnym'

type AiSearchBarProps = {
  className?: string
  onSearch?: (query: string) => void
}

export function AiSearchBar({ className, onSearch }: AiSearchBarProps) {
  const [query, setQuery] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!query.trim()) {
      return
    }
    const trimmed = query.trim()
    onSearch?.(trimmed)
    if (import.meta.env.DEV && !onSearch) {
      console.info('[AiSearchBar] submit (UI only):', trimmed)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('relative w-full max-w-md', className)}
      role="search"
    >
      <Sparkles
        className={cn(
          'pointer-events-none absolute top-1/2 left-4 -translate-y-1/2',
          appLayout.searchInputIcon,
        )}
        aria-hidden
      />
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={PLACEHOLDER}
        aria-label={SEARCH_LABEL}
        className={cn(
          appLayout.inputField,
          'border-0 pr-14 pl-12 text-base shadow-md placeholder:text-muted-foreground',
        )}
      />
      <Button
        type="submit"
        size="icon-sm"
        variant="default"
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full text-primary-foreground"
        aria-label="Szukaj planu"
      >
        <Search className="size-4 shrink-0 text-current" aria-hidden />
      </Button>
    </form>
  )
}
