import { useEffect, useState } from 'react'
import { Clock, Route } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchPlaceDetail } from '@/lib/placeApi'
import { categoryLabel, priceLabel } from '@/lib/searchApi'
import type { WalkingRoute } from '@/lib/walkingRoute'
import type { TrailStop } from '@/lib/trail'
import { trailPathKm, trailVisitMinutes } from '@/lib/trail'

type TrailDetailPanelProps = {
  stops: TrailStop[]
  selectedKey: string | null
  planSummary: string
  query: string
  walkingRoute: WalkingRoute | null
}

type DetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; description: string | null; officialUrl: string | null; bookingUrl: string | null }
  | { status: 'error' }

export function TrailDetailPanel({
  stops,
  selectedKey,
  planSummary,
  query,
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
      <Card className="border-border/80">
        <CardHeader className="gap-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{item.name}</CardTitle>
            <Badge variant="secondary">Przystanek {selected.order}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{placeLine || 'Lokalizacja na mapie'}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p>
            <span className="font-medium text-foreground">Kategoria:</span>{' '}
            {categoryLabel(item.category)}
          </p>
          <p>
            <span className="font-medium text-foreground">Bilety:</span>{' '}
            {priceLabel(item.price_level, item.flags)}
          </p>
          {item.typical_visit_minutes ? (
            <p>
              <span className="font-medium text-foreground">Czas zwiedzania:</span> ok.{' '}
              {item.typical_visit_minutes} min
            </p>
          ) : null}
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
            <div className="flex flex-wrap gap-3">
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
  const pathLabel = walkingRoute?.followsRoads ? 'pieszo po drogach' : 'w linii prostej'

  return (
    <Card className="border-border/80">
      <CardHeader className="gap-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Route className="size-5 text-primary" aria-hidden />
          Twój szlak zwiedzania
        </CardTitle>
        <p className="text-sm text-muted-foreground">{planSummary}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm leading-relaxed">
        <p>
          Na podstawie zapytania „{query}” ułożyliśmy trasę przez{' '}
          <strong>{stops.length}</strong> {stops.length === 1 ? 'miejsce' : 'miejsca'} z najlepszym
          dopasowaniem. Trasa na mapie jest wyznaczana pieszo po chodnikach i drogach (OSRM).
        </p>
        <p className="inline-flex items-center gap-2 text-muted-foreground">
          <Clock className="size-4 shrink-0 text-primary" aria-hidden />
          Zwiedzanie: ok. {visitMin} min
          {stops.length > 1
            ? ` · ${pathKm.toFixed(1)} km ${pathLabel}${walkMin ? ` · ok. ${Math.round(walkMin)} min marszu` : ''}`
            : ''}
        </p>
        <p>
          Kliknij numer na mapie, żeby zobaczyć nazwę, opis i informacje o biletach dla danego
          przystanku.
        </p>
        <ol className="list-decimal space-y-1 pl-5 text-foreground">
          {stops.map((stop) => (
            <li key={stop.key}>{stop.result.name}</li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
