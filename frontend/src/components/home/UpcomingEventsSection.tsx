import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'

import { EventPlaceholderCard } from '@/components/home/EventPlaceholderCard'
import { PlanSectionHeading } from '@/components/search-results/PlanSectionHeading'
import { formatEventLocation, formatEventWhen } from '@/lib/formatEventWhen'
import { fetchUpcomingEventsForHome } from '@/lib/homeEventsApi'
import { appLayout } from '@/lib/appLayout'
import {
  categoryLabel,
  searchPreferencesFromContext,
  type SearchResult,
} from '@/lib/searchApi'
import { loadUserContext } from '@/lib/userContextStorage'
import { cn } from '@/lib/utils'

const SECTION_TITLE = 'Nadchodzące wydarzenia dla Ciebie'
const HOME_EVENT_LIMIT = 4

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; events: HomeEventCard[] }
  | { status: 'error' }

type HomeEventCard = {
  id: string
  title: string
  dateLabel: string
  category: string
  locationLabel: string
}

function mapEvents(items: SearchResult[]): HomeEventCard[] {
  return items.map((item) => ({
    id: `event-${item.id}`,
    title: item.name,
    dateLabel: formatEventWhen(item.start_date ?? '', item.start_time),
    category: categoryLabel(item.category),
    locationLabel: formatEventLocation(item.city, item.address_line),
  }))
}

export function UpcomingEventsSection() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    setLoad({ status: 'loading' })
    const preferences = searchPreferencesFromContext(loadUserContext())
    fetchUpcomingEventsForHome({
      limit: HOME_EVENT_LIMIT,
      userPreferences: preferences,
      signal: controller.signal,
    })
      .then((events) => setLoad({ status: 'ready', events: mapEvents(events) }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        setLoad({ status: 'error' })
      })
    return () => controller.abort()
  }, [])

  const events = load.status === 'ready' ? load.events : []

  return (
    <section
      className={cn(appLayout.sectionStack, appLayout.pageX, 'pt-6', appLayout.pageBottom)}
      aria-labelledby="upcoming-events-heading"
      aria-busy={load.status === 'loading'}
    >
      <PlanSectionHeading id="upcoming-events-heading" title={SECTION_TITLE} icon={CalendarDays} />
      {load.status === 'loading' ? (
        <p className={appLayout.bodyMuted} role="status">Ładujemy wydarzenia…</p>
      ) : null}
      {load.status === 'error' ? (
        <p className={appLayout.bodyMuted} role="alert">
          Nie udało się pokazać wydarzeń. Spróbuj odświeżyć stronę.
        </p>
      ) : null}
      {load.status === 'ready' && events.length === 0 ? (
        <p className={appLayout.bodyMuted}>
          Brak nadchodzących wydarzeń w katalogu na najbliższe tygodnie.
        </p>
      ) : null}
      {events.length > 0 ? (
        <ul className={cn('m-0 list-none p-0', appLayout.listStack)}>
          {events.map((event) => (
            <li key={event.id}>
              <EventPlaceholderCard event={event} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
