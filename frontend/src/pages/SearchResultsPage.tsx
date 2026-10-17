import { CloudSun, Lightbulb, Ticket } from 'lucide-react'

import { EventPlaceholderCard } from '@/components/home/EventPlaceholderCard'
import { WavePageHeader } from '@/components/layout/WavePageHeader'
import { PlanInfoCard } from '@/components/search-results/PlanInfoCard'
import { PlanMapPlaceholder } from '@/components/search-results/PlanMapPlaceholder'
import { PlanResultsHeader } from '@/components/search-results/PlanResultsHeader'
import {
  DEFAULT_SEARCH_RESULTS,
  type SearchResultsPlaceholder,
} from '@/data/searchResultsPlaceholders'

type SearchResultsPageProps = {
  query: string
  onBack: () => void
  results?: SearchResultsPlaceholder
}

export function SearchResultsPage({
  query: _query,
  onBack,
  results = DEFAULT_SEARCH_RESULTS,
}: SearchResultsPageProps) {
  return (
    <div className="flex min-h-full flex-col">
      <WavePageHeader
        onBack={onBack}
        header={<PlanResultsHeader planSummary={results.planSummary} />}
        contentClassName="pt-[max(1rem,calc(env(safe-area-inset-top)+0.25rem))]"
      />
      <div
        className="home-surface-texture flex flex-1 flex-col gap-6 px-5 pt-7 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <PlanMapPlaceholder label={results.mapLabel} />

        <div className="flex flex-col gap-3" role="list">
          <PlanInfoCard icon={Ticket}>{results.ticketInfo}</PlanInfoCard>
          <PlanInfoCard icon={CloudSun}>{results.weatherInfo}</PlanInfoCard>
        </div>

        <section
          className="flex flex-col gap-4"
          aria-labelledby="related-suggestions-heading"
        >
          <h2
            id="related-suggestions-heading"
            className="flex items-center gap-2 text-lg font-semibold text-foreground"
          >
            <Lightbulb className="size-5 shrink-0 text-primary" aria-hidden />
            {results.relatedSectionTitle}
          </h2>
          <EventPlaceholderCard event={results.related} />
        </section>
      </div>
    </div>
  )
}
