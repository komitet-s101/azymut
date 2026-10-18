import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'

import { EventPlaceholderCard } from '@/components/home/EventPlaceholderCard'
import { fetchUpcomingEventsForHome } from '@/lib/homeEventsApi'
import { formatEventLocation, formatEventWhen } from '@/lib/formatEventWhen'
import {
  categoryLabel,
  searchPreferencesFromContext,
  type SearchResult,
} from '@/lib/searchApi'
import { loadUserContext } from '@/lib/userContextStorage'

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
      className="flex flex-col gap-4 px-5 pt-7 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      aria-labelledby="upcoming-events-heading"
      aria-busy={load.status === 'loading'}
    >
      <h2
        id="upcoming-events-heading"
        className="flex items-center gap-2 text-lg font-semibold text-foreground"
      >
        <CalendarDays className="size-5 text-primary" aria-hidden />
        {SECTION_TITLE}
      </h2>
      {load.status === 'loading' ? (
        <p className="text-sm text-muted-foreground" role="status">Ładujemy wydarzenia…</p>
      ) : null}
      {load.status === 'error' ? (
        <p className="text-sm text-muted-foreground" role="alert">
          Nie udało się pokazać wydarzeń. Spróbuj odświeżyć stronę.
        </p>
      ) : null}
      {load.status === 'ready' && events.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Brak nadchodzących wydarzeń w katalogu na najbliższe tygodnie.
        </p>
      ) : null}
      {events.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
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
