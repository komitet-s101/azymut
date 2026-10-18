import { CalendarDays, Clock, MapPin, Ticket } from 'lucide-react'

import { PlaceCoverImage } from '@/components/place/PlaceCoverImage'
import { PlanCategoryBadge } from '@/components/search-results/PlanCategoryBadge'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { appLayout } from '@/lib/appLayout'
import { categoryLabel, priceLabel, type SearchResult } from '@/lib/searchApi'
import { cn } from '@/lib/utils'

type SearchResultCardProps = {
  item: SearchResult
  trailOrder?: number
  selected?: boolean
  onSelect?: () => void
}

function shortDescription(description: string | null): string | null {
  if (!description?.trim()) {
    return null
  }
  const line = description.trim().split('\n')[0]?.trim() ?? ''
  if (line.length <= 120) {
    return line
  }
  return `${line.slice(0, 117)}…`
}

function formatVisitMinutes(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60
    return rest > 0 ? `ok. ${hours} h ${rest} min` : `ok. ${hours} h`
  }
  return `ok. ${minutes} min`
}

export function SearchResultCard({ item, trailOrder, selected, onSelect }: SearchResultCardProps) {
  const blurb = shortDescription(item.reason)
  const when = [item.start_date, item.start_time].filter(Boolean).join(' · ')
  const placeLine = [item.city, item.address_line].filter(Boolean).join(' · ')
  const hoursNote = item.flags.includes('check_hours') ? 'Sprawdź godziny otwarcia' : null

  const interactive = Boolean(onSelect)

  return (
    <Card
      className={cn(
        appLayout.cardShell,
        selected && 'ring-2 ring-primary',
        interactive && 'cursor-pointer',
      )}
      onClick={onSelect}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect?.()
              }
            }
          : undefined
      }
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? selected : undefined}
    >
      {item.kind === 'place' ? (
        <PlaceCoverImage
          name={item.name}
          source={{ external_id: item.external_id }}
          className="rounded-t-xl"
        />
      ) : null}
      <CardHeader className={appLayout.cardHeader}>
        <CardTitle className={appLayout.cardTitle}>{item.name}</CardTitle>
        {blurb ? <p className={appLayout.bodyMuted}>{blurb}</p> : null}
        <div
          className={cn(appLayout.resultMetaPanel, blurb ? 'mt-1' : 'mt-0.5')}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {trailOrder ? (
              <Badge variant="default" className="bg-primary text-primary-foreground">
                Przystanek {trailOrder}
              </Badge>
            ) : null}
            {item.kind === 'place' && item.category ? (
              <PlanCategoryBadge category={item.category} />
            ) : (
              <Badge variant="secondary">
                {item.kind === 'event' ? 'Wydarzenie' : categoryLabel(item.category)}
              </Badge>
            )}
          </div>
          <div className={cn(appLayout.metaStack, 'text-foreground/85')}>
            {when ? (
              <span className={appLayout.metaRow}>
                <CalendarDays className={appLayout.metaIcon} aria-hidden />
                {when}
              </span>
            ) : null}
            {placeLine ? (
              <span className={appLayout.metaRow}>
                <MapPin className={appLayout.metaIcon} aria-hidden />
                {placeLine}
              </span>
            ) : null}
            <span className={appLayout.metaRow}>
              <Ticket className={appLayout.metaIcon} aria-hidden />
              {priceLabel(item.price_level, item.flags)}
            </span>
            {item.typical_visit_minutes ? (
              <span className={appLayout.metaRow}>
                <Clock className={appLayout.metaIcon} aria-hidden />
                {formatVisitMinutes(item.typical_visit_minutes)}
              </span>
            ) : null}
            {hoursNote ? <span className={appLayout.metaRow}>{hoursNote}</span> : null}
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
