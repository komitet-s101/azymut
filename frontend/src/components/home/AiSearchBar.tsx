import { useState, type FormEvent } from 'react'
import { Search, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const PLACEHOLDER = 'Opisz, jak chcesz spędzić czas…'
const SEARCH_LABEL = 'Wyszukiwanie planu w języku naturalnym'

type AiSearchBarProps = {
  className?: string
}

export function AiSearchBar({ className }: AiSearchBarProps) {
  const [query, setQuery] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!query.trim()) {
      return
    }
    if (import.meta.env.DEV) {
      console.info('[AiSearchBar] submit (UI only):', query.trim())
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('relative w-full max-w-md', className)}
      role="search"
    >
      <Sparkles
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-primary"
        aria-hidden
      />
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={PLACEHOLDER}
        aria-label={SEARCH_LABEL}
        className="h-12 rounded-full border-0 bg-white pr-14 pl-12 text-base shadow-md text-foreground placeholder:text-muted-foreground"
      />
      <Button
        type="submit"
        size="icon-sm"
        variant="default"
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full"
        aria-label="Szukaj planu"
      >
        <Search className="size-4" aria-hidden />
      </Button>
    </form>
  )
}
