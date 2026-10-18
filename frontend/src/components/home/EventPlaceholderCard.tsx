import { CalendarDays, MapPin } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import type { UpcomingEventPlaceholder } from '@/data/homePlaceholders'
import { appLayout } from '@/lib/appLayout'
import { cn } from '@/lib/utils'

type EventPlaceholderCardProps = {
  event: UpcomingEventPlaceholder
}

export function EventPlaceholderCard({ event }: EventPlaceholderCardProps) {
  return (
    <Card className={appLayout.cardShell}>
      <div
        className="aspect-[16/9] w-full bg-muted"
        role="img"
        aria-label="Podgląd wydarzenia"
      />
      <CardHeader className={appLayout.cardHeader}>
        <CardTitle className={appLayout.cardTitle}>{event.title}</CardTitle>
        <div className={cn(appLayout.resultMetaPanel, 'mt-0.5')}>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{event.category}</Badge>
          </div>
          <div className={cn(appLayout.metaStack, 'text-foreground/85')}>
            <span className={appLayout.metaRow}>
              <CalendarDays className={appLayout.metaIcon} aria-hidden />
              {event.dateLabel}
            </span>
            <span className={appLayout.metaRow}>
              <MapPin className={appLayout.metaIcon} aria-hidden />
              {event.locationLabel}
            </span>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
