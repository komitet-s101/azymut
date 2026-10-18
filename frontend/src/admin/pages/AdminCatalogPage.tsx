import { useMemo, useState } from 'react'

import { useAdminCatalog } from '@/admin/context/AdminCatalogContext'
import type { CatalogEvent, CatalogPlace } from '@/admin/lib/adminCatalogApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { RouteSummary } from '@/lib/routeApi'
import { categoryLabel, priceLabel } from '@/lib/searchApi'
import { cn } from '@/lib/utils'

type CatalogTab = 'places' | 'events' | 'routes'

function placeSettingLabel(place: CatalogPlace): string {
  if (place.is_indoor && place.is_outdoor) {
    return 'indoor / outdoor'
  }
  if (place.is_indoor) {
    return 'indoor'
  }
  if (place.is_outdoor) {
    return 'outdoor'
  }
  return '—'
}

function verificationBadge(status: string | null) {
  const normalized = (status ?? '').toLowerCase()
  if (normalized === 'verified' || normalized === 'zweryfikowane') {
    return <Badge variant="secondary">Zweryfikowane</Badge>
  }
  if (!status) {
    return <Badge variant="outline">Brak statusu</Badge>
  }
  if (normalized.includes('pending') || normalized.includes('weryfik')) {
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">
        Do weryfikacji
      </Badge>
    )
  }
  return <Badge variant="outline">{status}</Badge>
}

function formatEventVenue(event: CatalogEvent): string {
  return event.venue_name ?? event.gmina ?? event.city ?? '—'
}

export function AdminCatalogPage() {
  const { places, events, routes, loading, error } = useAdminCatalog()
  const [tab, setTab] = useState<CatalogTab>('places')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const q = search.trim().toLowerCase()

  const filteredPlaces = useMemo(
    () =>
      places.filter(
        (row) =>
          !q ||
          row.name.toLowerCase().includes(q) ||
          row.gmina.toLowerCase().includes(q) ||
          (row.category ?? '').toLowerCase().includes(q) ||
          row.city.toLowerCase().includes(q),
      ),
    [places, q],
  )

  const filteredEvents = useMemo(
    () =>
      events.filter(
        (row) =>
          !q ||
          row.name.toLowerCase().includes(q) ||
          (row.venue_name ?? '').toLowerCase().includes(q) ||
          (row.category ?? '').toLowerCase().includes(q) ||
          (row.gmina ?? '').toLowerCase().includes(q),
      ),
    [events, q],
  )

  const filteredRoutes = useMemo(
    () =>
      routes.filter(
        (row) =>
          !q ||
          row.name.toLowerCase().includes(q) ||
          row.gmina.toLowerCase().includes(q) ||
          (row.route_type ?? '').toLowerCase().includes(q),
      ),
    [routes, q],
  )

  function showDemoToast(action: string) {
    setToast(`${action} — niedostępne w tej wersji panelu.`)
    window.setTimeout(() => setToast(null), 3500)
  }

  const tabCounts = {
    places: places.length,
    events: events.length,
    routes: routes.length,
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div
          role="status"
          className="rounded-lg border border-primary/30 bg-secondary px-4 py-3 text-sm text-primary"
        >
          {toast}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <Card className="border-border/80">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Zawartość katalogu</CardTitle>
          <Input
            type="search"
            placeholder="Szukaj po nazwie, gminie…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
            aria-label="Szukaj w katalogu"
            disabled={loading || Boolean(error)}
          />
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-4">
            {(
              [
                { id: 'places' as const, label: 'Miejsca' },
                { id: 'events' as const, label: 'Wydarzenia' },
                { id: 'routes' as const, label: 'Trasy' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  tab === t.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80',
                )}
              >
                {t.label}
                <span className="ml-1.5 tabular-nums opacity-80">({tabCounts[t.id]})</span>
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Ładowanie katalogu…</p>
          ) : null}

          {!loading && !error && tab === 'places' ? (
            <PlacesTable rows={filteredPlaces} onAction={showDemoToast} />
          ) : null}
          {!loading && !error && tab === 'events' ? (
            <EventsTable rows={filteredEvents} onAction={showDemoToast} />
          ) : null}
          {!loading && !error && tab === 'routes' ? (
            <RoutesTable rows={filteredRoutes} onAction={showDemoToast} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

type PlacesTableProps = {
  rows: CatalogPlace[]
  onAction: (label: string) => void
}

function PlacesTable({ rows, onAction }: PlacesTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Brak miejsc do wyświetlenia.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="pb-2 pr-3 font-medium">Nazwa</th>
            <th className="pb-2 pr-3 font-medium">Gmina</th>
            <th className="pb-2 pr-3 font-medium">Kategoria</th>
            <th className="pb-2 pr-3 font-medium">Środowisko</th>
            <th className="pb-2 pr-3 font-medium">Cena</th>
            <th className="pb-2 pr-3 font-medium">Status</th>
            <th className="pb-2 font-medium">Akcje</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border/60 last:border-0">
              <td className="py-2.5 pr-3 font-medium">{row.name}</td>
              <td className="py-2.5 pr-3 text-muted-foreground">{row.gmina}</td>
              <td className="py-2.5 pr-3 text-muted-foreground">
                {categoryLabel(row.category)}
              </td>
              <td className="py-2.5 pr-3 text-muted-foreground">{placeSettingLabel(row)}</td>
              <td className="py-2.5 pr-3 text-muted-foreground">
                {priceLabel(row.price_level, [])}
              </td>
              <td className="py-2.5 pr-3">{verificationBadge(row.verification_status)}</td>
              <td className="py-2.5">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => onAction('Edycja miejsca')}
                  >
                    Edytuj
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => onAction('Weryfikacja')}
                  >
                    Zweryfikuj
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type EventsTableProps = {
  rows: CatalogEvent[]
  onAction: (label: string) => void
}

function EventsTable({ rows, onAction }: EventsTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Brak nadchodzących wydarzeń.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="pb-2 pr-3 font-medium">Data</th>
            <th className="pb-2 pr-3 font-medium">Wydarzenie</th>
            <th className="pb-2 pr-3 font-medium">Miejsce</th>
            <th className="pb-2 pr-3 font-medium">Kategoria</th>
            <th className="pb-2 font-medium">Akcje</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border/60 last:border-0">
              <td className="py-2.5 pr-3 whitespace-nowrap text-muted-foreground">
                {row.start_date}
                {row.start_time ? ` ${row.start_time}` : ''}
              </td>
              <td className="py-2.5 pr-3 font-medium">{row.name}</td>
              <td className="py-2.5 pr-3 text-muted-foreground">{formatEventVenue(row)}</td>
              <td className="py-2.5 pr-3 text-muted-foreground">
                {categoryLabel(row.category)}
              </td>
              <td className="py-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => onAction('Edycja wydarzenia')}
                >
                  Edytuj
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type RoutesTableProps = {
  rows: RouteSummary[]
  onAction: (label: string) => void
}

function RoutesTable({ rows, onAction }: RoutesTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Brak tras do wyświetlenia.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="pb-2 pr-3 font-medium">Nazwa</th>
            <th className="pb-2 pr-3 font-medium">Czas</th>
            <th className="pb-2 pr-3 font-medium">Przystanki</th>
            <th className="pb-2 pr-3 font-medium">Gmina</th>
            <th className="pb-2 pr-3 font-medium">Typ</th>
            <th className="pb-2 font-medium">Akcje</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border/60 last:border-0">
              <td className="py-2.5 pr-3 font-medium">{row.name}</td>
              <td className="py-2.5 pr-3 text-muted-foreground">
                {row.duration_minutes_approx} min
              </td>
              <td className="py-2.5 pr-3 tabular-nums">
                {row.stops_min}–{row.stops_max}
              </td>
              <td className="py-2.5 pr-3 text-muted-foreground">{row.gmina}</td>
              <td className="py-2.5 pr-3 capitalize text-muted-foreground">
                {row.route_type ?? '—'}
              </td>
              <td className="py-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => onAction('Edycja trasy')}
                >
                  Edytuj
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
