import { Clock3, MapPin } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { appLayout } from '@/lib/appLayout'
import { categoryLabel, priceLabel, type SearchResult } from '@/lib/searchApi'
import { cn } from '@/lib/utils'

type HomePlaceCardProps = {
  place: SearchResult
}

export function HomePlaceCard({ place }: HomePlaceCardProps) {
  const visit =
    place.typical_visit_minutes && place.typical_visit_minutes > 0
      ? `ok. ${place.typical_visit_minutes} min`
      : null
  const location = place.address_line || place.city || 'Płock'

  return (
    <Card className={appLayout.cardShell}>
      <div
        className="aspect-[16/9] w-full bg-muted"
        role="img"
        aria-label="Podgląd miejsca"
      />
      <CardHeader className={appLayout.cardHeader}>
        <CardTitle className={appLayout.cardTitle}>{place.name}</CardTitle>
        <div className={cn(appLayout.resultMetaPanel, 'mt-0.5')}>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{categoryLabel(place.category)}</Badge>
            <Badge variant="outline">{priceLabel(place.price_level, place.flags)}</Badge>
          </div>
          <div className={cn(appLayout.metaStack, 'text-foreground/85')}>
            {visit ? (
              <span className={appLayout.metaRow}>
                <Clock3 className={appLayout.metaIcon} aria-hidden />
                {visit}
              </span>
            ) : null}
            <span className={appLayout.metaRow}>
              <MapPin className={appLayout.metaIcon} aria-hidden />
              {location}
            </span>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
