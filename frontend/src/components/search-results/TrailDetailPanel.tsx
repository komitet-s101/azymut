import { Clock, Footprints, MapPinned, Route } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { appLayout } from '@/lib/appLayout'
import { cn } from '@/lib/utils'
import type { WalkingRoute } from '@/lib/walkingRoute'
import type { TrailMode, TrailStop } from '@/lib/trail'
import { trailPathKm, trailVisitMinutes } from '@/lib/trail'

type TrailDetailPanelProps = {
  stops: TrailStop[]
  trailMode: TrailMode | null
  selectedKey: string | null
  walkingRoute: WalkingRoute | null
  onSelectStop?: (key: string) => void
}

function polishPlaceCount(n: number): string {
  if (n === 1) {
    return '1 miejsce'
  }
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${n} miejsca`
  }
  return `${n} miejsc`
}

function trailIntro(trailMode: TrailMode | null, stopCount: number): string {
  if (trailMode === 'event') {
    if (stopCount === 1) {
      return 'To wydarzenie z kalendarza — skupiamy się na nim, bez dokładania innych punktów obok.'
    }
    if (stopCount === 2) {
      return 'Dwa wydarzenia jedno po drugim — w kolejności, która ma sens.'
    }
    return `${stopCount} wydarzeń w jednym planie — spokojnie, bez pośpiechu.`
  }
  if (stopCount === 1) {
    return 'Jedno miejsce na spokojnie — bez biegania po całej mapie.'
  }
  if (stopCount === 2) {
    return 'Dwa punkty blisko siebie — krótko i przyjemnie.'
  }
  return `${polishPlaceCount(stopCount)} w jednym planie — po drodze, bez dalekich objazdów.`
}

export function TrailDetailPanel({
  stops,
  trailMode,
  selectedKey,
  walkingRoute,
  onSelectStop,
}: TrailDetailPanelProps) {
  const pathKm = walkingRoute?.distanceKm ?? trailPathKm(stops)
  const walkMin = walkingRoute?.durationMinutes
  const visitMin = trailVisitMinutes(stops)

  const title =
    trailMode === 'event'
      ? stops.length === 1
        ? 'Twoje wydarzenie'
        : 'Plan wydarzeń'
      : 'Twój spersonalizowany szlak zwiedzania'

  return (
    <Card className="gap-2 border-border/80">
      <CardHeader className={cn(appLayout.cardHeader, 'border-b border-border/60 pb-3')}>
        <CardTitle className={cn('flex items-center gap-2', appLayout.cardTitle)}>
          <Route className={appLayout.metaIcon} aria-hidden />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('flex flex-col pt-3', appLayout.listStack)}>
        <p className={appLayout.bodyMuted}>{trailIntro(trailMode, stops.length)}</p>

        <ul className={cn(appLayout.metaStack, 'text-foreground')}>
          <li className={appLayout.metaRow}>
            <Clock className={appLayout.metaIcon} aria-hidden />
            <span>ok. {visitMin} min</span>
          </li>
          {stops.length > 1 ? (
            <li className={appLayout.metaRow}>
              <MapPinned className={appLayout.metaIcon} aria-hidden />
              <span>{pathKm.toFixed(1)} km</span>
            </li>
          ) : null}
          {stops.length > 1 && walkMin ? (
            <li className={appLayout.metaRow}>
              <Footprints className={appLayout.metaIcon} aria-hidden />
              <span>ok. {Math.round(walkMin)} min marszu</span>
            </li>
          ) : null}
        </ul>

        <section className={appLayout.listStack} aria-labelledby="trail-stops-heading">
          <h3 id="trail-stops-heading" className="text-sm font-semibold text-foreground">
            Kolejność — kliknij punkt, aby zobaczyć szczegóły
          </h3>
          <ol className={appLayout.metaStack}>
            {stops.map((stop) => {
              const selected = selectedKey === stop.key
              return (
                <li key={stop.key}>
                  <button
                    type="button"
                    onClick={() => onSelectStop?.(stop.key)}
                    className={cn(
                      'flex w-full items-start gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors',
                      selected
                        ? 'border-primary bg-secondary ring-1 ring-primary/20'
                        : 'border-border/70 bg-card hover:border-primary/40',
                    )}
                  >
                    <span
                      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[0.6875rem] font-bold text-primary-foreground"
                      aria-hidden
                    >
                      {stop.order}
                    </span>
                    <span className="pt-0.5 text-sm font-medium leading-snug text-foreground">
                      {stop.result.name}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </section>
      </CardContent>
    </Card>
  )
}
