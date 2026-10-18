import { useMemo, useState } from 'react'

import { useAdminCatalog } from '@/admin/context/AdminCatalogContext'
import {
  catalogInsights,
  topCategoriesFromPlaces,
  upcomingEventsPreview,
  uniqueCategories,
} from '@/admin/lib/adminStats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function AdminQueriesPage() {
  const { places, events, routes, loading, error } = useAdminCatalog()
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const categories = useMemo(() => uniqueCategories(places), [places])
  const categoryCounts = useMemo(() => topCategoriesFromPlaces(places, 20), [places])
  const insights = useMemo(
    () => catalogInsights(places, events, routes),
    [places, events, routes],
  )
  const eventRows = useMemo(() => upcomingEventsPreview(events, 30), [events])

  const filteredEvents = useMemo(() => {
    if (categoryFilter === 'all') {
      return eventRows
    }
    return eventRows.filter((row) => row.category === categoryFilter)
  }, [eventRows, categoryFilter])

  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error}
      </p>
    )
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Ładowanie…</p>
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-base">Filtr kategorii wydarzeń</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
              categoryFilter === 'all'
                ? 'border-primary bg-secondary text-primary'
                : 'border-border bg-card hover:bg-muted',
            )}
          >
            Wszystkie
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                categoryFilter === cat
                  ? 'border-primary bg-secondary text-primary'
                  : 'border-border bg-card hover:bg-muted',
              )}
            >
              {cat}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-base">
            Nadchodzące wydarzenia ({filteredEvents.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Dane z bazy — typowe cele zapytań użytkowników o „co się dzieje w okolicy”
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Termin</th>
                <th className="pb-2 pr-3 font-medium">Nazwa</th>
                <th className="pb-2 pr-3 font-medium">Miejsce</th>
                <th className="pb-2 font-medium">Kategoria</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((row) => (
                <tr key={row.id} className="border-b border-border/60 align-top last:border-0">
                  <td className="py-3 pr-3 whitespace-nowrap text-muted-foreground">
                    {row.date}
                  </td>
                  <td className="py-3 pr-3 font-medium">{row.name}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{row.location}</td>
                  <td className="py-3">{row.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-base">Kategorie miejsc w katalogu</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full max-w-lg text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Kategoria</th>
                <th className="pb-2 text-right font-medium">Liczba miejsc</th>
              </tr>
            </thead>
            <tbody>
              {categoryCounts.map((row) => (
                <tr key={row.label} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-3">{row.label}</td>
                  <td className="py-2.5 text-right tabular-nums">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-secondary/30">
        <CardHeader>
          <CardTitle className="text-base">Wnioski z katalogu</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
            {insights.map((line) => (
              <li key={line.id}>{line.text}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
