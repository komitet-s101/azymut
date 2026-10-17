import { useEffect, useState } from 'react'
import { Clock, Footprints, MapPinned, Route } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchPlaceDetail } from '@/lib/placeApi'
import { categoryLabel, priceLabel } from '@/lib/searchApi'
import type { WalkingRoute } from '@/lib/walkingRoute'
import type { TrailMode, TrailStop } from '@/lib/trail'
import { trailPathKm, trailVisitMinutes } from '@/lib/trail'

type TrailDetailPanelProps = {
  stops: TrailStop[]
  trailMode: TrailMode | null
  selectedKey: string | null
  walkingRoute: WalkingRoute | null
}

type DetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; description: string | null; officialUrl: string | null; bookingUrl: string | null }
  | { status: 'error' }

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
}: TrailDetailPanelProps) {
  const selected = stops.find((stop) => stop.key === selectedKey) ?? null
  const [detail, setDetail] = useState<DetailState>({ status: 'idle' })

  useEffect(() => {
    if (!selected || selected.result.kind !== 'place') {
      setDetail({ status: 'idle' })
      return
    }
    const controller = new AbortController()
    setDetail({ status: 'loading' })
    fetchPlaceDetail(selected.result.id, controller.signal)
      .then((place) =>
        setDetail({
          status: 'ready',
          description: place.description,
          officialUrl: place.official_url,
          bookingUrl: place.booking_url,
        }),
      )
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        setDetail({ status: 'error' })
      })
    return () => controller.abort()
  }, [selected])

  if (selected) {
    const item = selected.result
    const placeLine = [item.city, item.address_line].filter(Boolean).join(' · ')
    return (
      <Card className="gap-2 border-border/80">
        <CardHeader className="gap-2 border-b border-border/60 pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-snug">{item.name}</CardTitle>
            <Badge variant="secondary">Przystanek {selected.order}</Badge>
          </div>
          {placeLine ? (
            <p className="text-sm text-muted-foreground">{placeLine}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Lokalizacja na mapie</p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-3 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-muted/40 px-3 py-2.5">
              <dt className="text-xs font-medium text-muted-foreground">Kategoria</dt>
              <dd className="mt-0.5 font-medium text-foreground">{categoryLabel(item.category)}</dd>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2.5">
              <dt className="text-xs font-medium text-muted-foreground">Bilety</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {priceLabel(item.price_level, item.flags)}
              </dd>
            </div>
            {item.typical_visit_minutes ? (
              <div className="rounded-lg bg-muted/40 px-3 py-2.5 sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">Czas zwiedzania</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  ok. {item.typical_visit_minutes} min
                </dd>
              </div>
            ) : null}
          </dl>

          {detail.status === 'loading' ? <p role="status">Ładujemy opis…</p> : null}
          {detail.status === 'ready' && detail.description ? (
            <p className="leading-relaxed text-foreground">{detail.description}</p>
          ) : null}
          {detail.status === 'ready' && !detail.description && item.reason ? (
            <p className="leading-relaxed text-foreground">{item.reason}</p>
          ) : null}
          {detail.status === 'error' ? (
            <p className="text-muted-foreground">Brak opisu — sprawdź kartę miejsca poniżej.</p>
          ) : null}
          {detail.status === 'ready' && (detail.officialUrl || detail.bookingUrl) ? (
            <div className="flex flex-wrap gap-3 border-t border-border/60 pt-4">
              {detail.officialUrl ? (
                <a
                  href={detail.officialUrl}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Strona miejsca
                </a>
              ) : null}
              {detail.bookingUrl ? (
                <a
                  href={detail.bookingUrl}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Rezerwacja
                </a>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    )
  }

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
      <CardHeader className="border-b border-border/60 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Route className="size-4 shrink-0 text-primary" aria-hidden />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3.5 pt-3">
        <p className="text-sm leading-snug text-muted-foreground">
          {trailIntro(trailMode, stops.length)}
        </p>

        <ul className="flex flex-col gap-1.5 text-sm text-foreground">
          <li className="flex items-center gap-2.5">
            <Clock className="size-4 shrink-0 text-primary" aria-hidden />
            <span>ok. {visitMin} min</span>
          </li>
          {stops.length > 1 ? (
            <li className="flex items-center gap-2.5">
              <MapPinned className="size-4 shrink-0 text-primary" aria-hidden />
              <span>{pathKm.toFixed(1)} km</span>
            </li>
          ) : null}
          {stops.length > 1 && walkMin ? (
            <li className="flex items-center gap-2.5">
              <Footprints className="size-4 shrink-0 text-primary" aria-hidden />
              <span>ok. {Math.round(walkMin)} min marszu</span>
            </li>
          ) : null}
        </ul>

        <section className="flex flex-col gap-2" aria-labelledby="trail-stops-heading">
          <h3 id="trail-stops-heading" className="text-sm font-semibold text-foreground">
            Kolejność
          </h3>
          <ol className="flex flex-col gap-1.5">
            {stops.map((stop) => (
              <li
                key={stop.key}
                className="flex items-start gap-2.5 rounded-lg border border-border/70 bg-card px-2.5 py-2"
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
              </li>
            ))}
          </ol>
        </section>
      </CardContent>
    </Card>
  )
}
