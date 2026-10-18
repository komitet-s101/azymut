import { CalendarDays, MapPin } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import type { UpcomingEventPlaceholder } from '@/data/homePlaceholders'

type EventPlaceholderCardProps = {
  event: UpcomingEventPlaceholder
}

export function EventPlaceholderCard({ event }: EventPlaceholderCardProps) {
  return (
    <Card className="gap-0 overflow-hidden border-border/80 py-0">
      <div
        className="aspect-[16/9] w-full bg-muted"
        role="img"
        aria-label="Podgląd wydarzenia"
      />
      <CardHeader className="gap-2 px-4 pt-2.5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{event.title}</CardTitle>
          <Badge variant="secondary" className="shrink-0">
            {event.category}
          </Badge>
        </div>
        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden />
            {event.dateLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
            {event.locationLabel}
          </span>
        </div>
      </CardHeader>
    </Card>
  )
}
