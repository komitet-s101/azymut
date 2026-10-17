import { useEffect, useState } from 'react'
import { CloudSun, Lightbulb, Ticket } from 'lucide-react'

import { WavePageHeader } from '@/components/layout/WavePageHeader'
import { PlanInfoCard } from '@/components/search-results/PlanInfoCard'
import { PlanMapPlaceholder } from '@/components/search-results/PlanMapPlaceholder'
import { PlanResultsHeader } from '@/components/search-results/PlanResultsHeader'
import { SearchResultCard } from '@/components/search-results/SearchResultCard'
import { searchNaturalLanguage, type SearchResponse } from '@/lib/searchApi'

type SearchResultsPageProps = {
  query: string
  onBack: () => void
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; data: SearchResponse }
  | { status: 'error'; message: string }

export function SearchResultsPage({ query, onBack }: SearchResultsPageProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })
    searchNaturalLanguage(query, controller.signal)
      .then((data) => setState({ status: 'ready', data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        const message = error instanceof Error ? error.message : 'Nie udało się wyszukać.'
        setState({ status: 'error', message })
      })
    return () => controller.abort()
  }, [query])

  const summary = state.status === 'ready' ? state.data.summary : query
  const weather =
    state.status === 'ready'
      ? (state.data.weather_note ?? 'Pogoda nie zmieniła kolejności wyników.')
      : 'Sprawdzamy pogodę…'
  const ticket =
    state.status === 'ready' && state.data.results[0]
      ? state.data.results[0].price_level === 0
        ? 'Najlepszy wynik jest bezpłatny albo ma niepewną cenę — szczegóły na kartach.'
        : 'Ceny są na kartach poniżej. Niepotwierdzone nie są traktowane jako darmowe.'
      : 'Ceny pojawią się przy wynikach.'

  return (
    <div className="flex min-h-full flex-col">
      <WavePageHeader
        onBack={onBack}
        header={<PlanResultsHeader planSummary={summary} />}
        contentClassName="pt-[max(1rem,calc(env(safe-area-inset-top)+0.25rem))]"
      />
      <div className="home-surface-texture flex flex-1 flex-col gap-6 px-5 pt-7 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <p className="text-sm text-muted-foreground">Zapytanie: {query}</p>
        <PlanMapPlaceholder label="Pokaż na mapie" />

        <div className="flex flex-col gap-3">
          <PlanInfoCard icon={Ticket}>{ticket}</PlanInfoCard>
          <PlanInfoCard icon={CloudSun}>{weather}</PlanInfoCard>
        </div>

        <section className="flex flex-col gap-4" aria-labelledby="search-results-heading" aria-busy={state.status === 'loading'}>
          <h2
            id="search-results-heading"
            className="flex items-center gap-2 text-lg font-semibold text-foreground"
          >
            <Lightbulb className="size-5 shrink-0 text-primary" aria-hidden />
            Pasujące miejsca i wydarzenia
          </h2>
          {state.status === 'loading' ? (
            <p role="status">Szukamy miejsc…</p>
          ) : null}
          {state.status === 'error' ? (
            <p role="alert">{state.message}</p>
          ) : null}
          {state.status === 'ready' && state.data.results.length === 0 ? (
            <p>Nie znaleźliśmy miejsc na te warunki. Wydłuż czas albo poluzuj cenę.</p>
          ) : null}
          {state.status === 'ready' ? (
            <ol className="flex flex-col gap-3">
              {state.data.results.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <SearchResultCard item={item} />
                </li>
              ))}
            </ol>
          ) : null}
        </section>
      </div>
    </div>
  )
}
