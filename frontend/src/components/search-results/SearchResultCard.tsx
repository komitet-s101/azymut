import { CalendarDays, MapPin } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { categoryLabel, priceLabel, type SearchResult } from '@/lib/searchApi'

type SearchResultCardProps = {
  item: SearchResult
}

export function SearchResultCard({ item }: SearchResultCardProps) {
  const when = [item.start_date, item.start_time].filter(Boolean).join(' · ')
  const placeLine = [item.city, item.address_line].filter(Boolean).join(' · ')
  const hoursNote = item.flags.includes('check_hours') ? 'Sprawdź godziny otwarcia' : null

  return (
    <Card className="gap-0 overflow-hidden border-border/80 py-0">
      <CardHeader className="gap-2 px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{item.name}</CardTitle>
          <Badge variant="secondary" className="shrink-0">
            {item.kind === 'event' ? 'Wydarzenie' : categoryLabel(item.category)}
          </Badge>
        </div>
        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          {when ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden />
              {when}
            </span>
          ) : null}
          {placeLine ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
              {placeLine}
            </span>
          ) : null}
          <span>{priceLabel(item.price_level, item.flags)}</span>
          {item.typical_visit_minutes ? <span>ok. {item.typical_visit_minutes} min</span> : null}
          {hoursNote ? <span>{hoursNote}</span> : null}
          {item.reason ? <span className="text-foreground">{item.reason}</span> : null}
        </div>
      </CardHeader>
    </Card>
  )
}
