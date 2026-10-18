import { useMemo } from 'react'

import { useAdminCatalog } from '@/admin/context/AdminCatalogContext'
import { KpiCard } from '@/admin/components/KpiCard'
import { MockBarChart } from '@/admin/components/MockBarChart'
import {
  buildDashboardKpis,
  priceLevelShares,
  samplePlacesTable,
  settingShares,
  topCategoriesFromPlaces,
  topGminyFromPlaces,
  upcomingEventsPreview,
} from '@/admin/lib/adminStats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AdminDashboardPage() {
  const { places, events, routes, loading, error } = useAdminCatalog()

  const kpis = useMemo(
    () => buildDashboardKpis(places, events, routes),
    [places, events, routes],
  )
  const categories = useMemo(() => topCategoriesFromPlaces(places), [places])
  const gminy = useMemo(() => topGminyFromPlaces(places), [places])
  const settings = useMemo(() => settingShares(places), [places])
  const prices = useMemo(() => priceLevelShares(places), [places])
  const placeSample = useMemo(() => samplePlacesTable(places), [places])
  const eventPreview = useMemo(() => upcomingEventsPreview(events, 6), [events])

  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error} Uruchom backend (port 8000) i odśwież stronę.
      </p>
    )
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Ładowanie danych z bazy…</p>
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} label={kpi.label} value={kpi.value} hint={kpi.hint} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MockBarChart
          title="Kategorie miejsc"
          description="Liczba wpisów w katalogu według kategorii"
          items={categories}
        />
        <MockBarChart
          title="Gminy"
          description="Rozkład miejsc według gminy"
          items={gminy}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MockBarChart
          title="Poziomy ceny"
          description="Miejsca według price_level w bazie"
          items={prices}
        />
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Środowisko (indoor / outdoor)</CardTitle>
            <p className="text-sm text-muted-foreground">Udział miejsc w katalogu</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak danych.</p>
            ) : (
              settings.map((row) => (
                <div key={row.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{row.label}</span>
                    <span className="tabular-nums text-muted-foreground">{row.percent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Przykładowe miejsca z bazy</CardTitle>
            <p className="text-sm text-muted-foreground">Alfabetycznie — pierwsze wpisy</p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Miejsce</th>
                  <th className="pb-2 pr-4 font-medium">Gmina</th>
                  <th className="pb-2 pr-4 font-medium">Kategoria</th>
                  <th className="pb-2 font-medium">Czas</th>
                </tr>
              </thead>
              <tbody>
                {placeSample.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-4 font-medium">{row.name}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{row.gmina}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{row.category}</td>
                    <td className="py-2.5 tabular-nums">{row.visitMinutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Najbliższe wydarzenia</CardTitle>
            <p className="text-sm text-muted-foreground">Z tabeli event w bazie</p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Termin</th>
                  <th className="pb-2 pr-4 font-medium">Wydarzenie</th>
                  <th className="pb-2 font-medium">Lokalizacja</th>
                </tr>
              </thead>
              <tbody>
                {eventPreview.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground">
                      {row.date}
                    </td>
                    <td className="py-2.5 pr-4 font-medium">{row.name}</td>
                    <td className="py-2.5 text-muted-foreground">{row.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
