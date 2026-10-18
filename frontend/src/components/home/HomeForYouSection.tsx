import { useEffect, useMemo, useState } from 'react'
import { PlanPlaceDetailSheet } from '@/components/search-results/PlanPlaceDetailSheet'
import { PlanSectionHeading } from '@/components/search-results/PlanSectionHeading'
import { SearchResultCard } from '@/components/search-results/SearchResultCard'
import { CUSTOM_INTEREST_ID } from '@/data/interestCategories'
import { fetchRecommendedPlacesForHome } from '@/lib/homeFeedApi'
import { fetchUpcomingEventsForHome } from '@/lib/homeEventsApi'
import {
  HOME_FOR_YOU_SECTION_ICON,
  HOME_FOR_YOU_SECTION_TITLE,
} from '@/lib/homePersonalization'
import { appLayout } from '@/lib/appLayout'
import { searchPreferencesFromContext, type SearchResult } from '@/lib/searchApi'
import { loadUserContext } from '@/lib/userContextStorage'
import { resultKey } from '@/lib/trail'
import { cn } from '@/lib/utils'

const HOME_PLACE_LIMIT = 6
const HOME_EVENT_LIMIT = 4

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; items: SearchResult[] }
  | { status: 'error' }

function buildFeed(places: SearchResult[], events: SearchResult[]): SearchResult[] {
  return [...places, ...events]
}

export function HomeForYouSection() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [selectedStopKey, setSelectedStopKey] = useState<string | null>(null)
  const context = loadUserContext()
  const hasInterests = Boolean(
    context?.onboarding_completed_at &&
      context.interest_tag_ids.some((id) => id !== CUSTOM_INTEREST_ID),
  )
  const interestKey = context?.interest_tag_ids?.join('|') ?? ''

  useEffect(() => {
    if (!hasInterests) {
      setLoad({ status: 'ready', items: [] })
      return
    }

    const controller = new AbortController()
    setLoad({ status: 'loading' })
    setSelectedStopKey(null)
    const preferences = searchPreferencesFromContext(loadUserContext())

    Promise.all([
      fetchRecommendedPlacesForHome({
        limit: HOME_PLACE_LIMIT,
        userPreferences: preferences,
        signal: controller.signal,
      }),
      fetchUpcomingEventsForHome({
        limit: HOME_EVENT_LIMIT,
        userPreferences: preferences,
        signal: controller.signal,
      }),
    ])
      .then(([places, events]) => {
        setLoad({ status: 'ready', items: buildFeed(places, events) })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        setLoad({ status: 'error' })
      })

    return () => controller.abort()
  }, [hasInterests, context?.onboarding_completed_at, interestKey])

  const items = load.status === 'ready' ? load.items : []

  const selectedItem = useMemo(() => {
    if (!selectedStopKey) {
      return null
    }
    return items.find((item) => resultKey(item) === selectedStopKey) ?? null
  }, [items, selectedStopKey])

  if (!hasInterests) {
    return null
  }

  if (load.status === 'ready' && load.items.length === 0) {
    return null
  }

  return (
    <section
      className={cn(appLayout.sectionStack, appLayout.pageX, 'pt-6', appLayout.pageBottom)}
      aria-labelledby="home-for-you-heading"
      aria-busy={load.status === 'loading'}
    >
      <PlanSectionHeading
        id="home-for-you-heading"
        title={HOME_FOR_YOU_SECTION_TITLE}
        icon={HOME_FOR_YOU_SECTION_ICON}
      />
      {load.status === 'loading' ? (
        <p className={appLayout.bodyMuted} role="status">Ładujemy propozycje…</p>
      ) : null}
      {load.status === 'error' ? (
        <p className={appLayout.bodyMuted} role="alert">
          Nie udało się załadować propozycji. Spróbuj odświeżyć stronę.
        </p>
      ) : null}
      {items.length > 0 ? (
        <ul className={cn('m-0 list-none p-0', appLayout.listStack)}>
          {items.map((item) => {
            const key = resultKey(item)
            return (
              <li key={key}>
                <SearchResultCard
                  item={item}
                  selected={selectedStopKey === key}
                  onSelect={() => setSelectedStopKey(key)}
                />
              </li>
            )
          })}
        </ul>
      ) : null}

      <PlanPlaceDetailSheet
        open={selectedItem !== null}
        item={selectedItem}
        onClose={() => setSelectedStopKey(null)}
      />
    </section>
  )
}
