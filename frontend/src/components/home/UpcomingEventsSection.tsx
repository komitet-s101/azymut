import { CalendarDays } from 'lucide-react'

import { EventPlaceholderCard } from '@/components/home/EventPlaceholderCard'
import { STATIC_UPCOMING_EVENTS } from '@/data/homePlaceholders'

const SECTION_TITLE = 'Nadchodzące wydarzenia dla Ciebie'

export function UpcomingEventsSection() {
  return (
    <section
      className="flex flex-col gap-4 px-5 pt-7 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      aria-labelledby="upcoming-events-heading"
    >
      <h2
        id="upcoming-events-heading"
        className="flex items-center gap-2 text-lg font-semibold text-foreground"
      >
        <CalendarDays className="size-5 text-primary" aria-hidden />
        {SECTION_TITLE}
      </h2>
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {STATIC_UPCOMING_EVENTS.map((event) => (
          <li key={event.id}>
            <EventPlaceholderCard event={event} />
          </li>
        ))}
      </ul>
    </section>
  )
}
