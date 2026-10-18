import type { CatalogEvent, CatalogPlace } from '@/admin/lib/adminCatalogApi'
import type { RouteSummary } from '@/lib/routeApi'
import { categoryLabel, priceLabel } from '@/lib/searchApi'

export type AdminKpi = {
  id: string
  label: string
  value: string
  hint: string
}

export type BarChartItem = {
  label: string
  value: number
}

export type ShareRow = {
  label: string
  percent: number
}

export type PlaceTableRow = {
  id: number
  name: string
  gmina: string
  category: string
  visitMinutes: string
}

export type CatalogInsightRow = {
  id: string
  text: string
}

function countByField(
  places: CatalogPlace[],
  field: (place: CatalogPlace) => string,
): BarChartItem[] {
  const counts = new Map<string, number>()
  for (const place of places) {
    const key = field(place)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

export function buildDashboardKpis(
  places: CatalogPlace[],
  events: CatalogEvent[],
  routes: RouteSummary[],
): AdminKpi[] {
  const gminy = new Set(places.map((p) => p.gmina).filter(Boolean))
  const cities = new Set(places.map((p) => p.city).filter(Boolean))

  return [
    {
      id: 'places',
      label: 'Miejsca w katalogu',
      value: String(places.length),
      hint: `${gminy.size} gmin w danych`,
    },
    {
      id: 'events',
      label: 'Nadchodzące wydarzenia',
      value: String(events.length),
      hint: 'Termin od dziś w bazie',
    },
    {
      id: 'routes',
      label: 'Trasy gotowe',
      value: String(routes.length),
      hint: 'Zdefiniowane ścieżki',
    },
    {
      id: 'cities',
      label: 'Miasta / obszary',
      value: String(cities.size),
      hint: 'Unikalne wartości pola city',
    },
  ]
}

export function topCategoriesFromPlaces(places: CatalogPlace[], limit = 8): BarChartItem[] {
  return countByField(places, (p) => categoryLabel(p.category)).slice(0, limit)
}

export function topGminyFromPlaces(places: CatalogPlace[], limit = 8): BarChartItem[] {
  return countByField(places, (p) => p.gmina || '—').slice(0, limit)
}

export function settingShares(places: CatalogPlace[]): ShareRow[] {
  if (places.length === 0) {
    return []
  }
  let indoor = 0
  let outdoor = 0
  let both = 0
  let other = 0
  for (const place of places) {
    if (place.is_indoor && place.is_outdoor) {
      both += 1
    } else if (place.is_indoor) {
      indoor += 1
    } else if (place.is_outdoor) {
      outdoor += 1
    } else {
      other += 1
    }
  }
  const total = places.length
  const rows: ShareRow[] = [
    { label: 'Tylko indoor', percent: Math.round((indoor / total) * 100) },
    { label: 'Tylko outdoor', percent: Math.round((outdoor / total) * 100) },
    { label: 'Indoor i outdoor', percent: Math.round((both / total) * 100) },
  ]
  if (other > 0) {
    rows.push({ label: 'Nieokreślone', percent: Math.round((other / total) * 100) })
  }
  return rows.filter((row) => row.percent > 0)
}

export function priceLevelShares(places: CatalogPlace[]): BarChartItem[] {
  const counts = new Map<string, number>()
  for (const place of places) {
    const label = priceLabel(place.price_level, [])
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

export function samplePlacesTable(places: CatalogPlace[], limit = 8): PlaceTableRow[] {
  return [...places]
    .sort((a, b) => a.name.localeCompare(b.name, 'pl'))
    .slice(0, limit)
    .map((place) => ({
      id: place.id,
      name: place.name,
      gmina: place.gmina,
      category: categoryLabel(place.category),
      visitMinutes:
        place.typical_visit_minutes != null ? `${place.typical_visit_minutes} min` : '—',
    }))
}

export function catalogInsights(
  places: CatalogPlace[],
  events: CatalogEvent[],
  routes: RouteSummary[],
): CatalogInsightRow[] {
  const categories = topCategoriesFromPlaces(places, 1)[0]
  const gminy = topGminyFromPlaces(places, 1)[0]
  const freeCount = places.filter((p) => p.price_level === 0).length
  const freePercent = places.length
    ? Math.round((freeCount / places.length) * 100)
    : 0

  const lines: string[] = []
  if (categories) {
    lines.push(
      `Najliczniejsza kategoria miejsc: ${categories.label} (${categories.value} wpisów).`,
    )
  }
  if (gminy) {
    lines.push(`Najwięcej miejsc w gminie: ${gminy.label} (${gminy.value}).`)
  }
  lines.push(
    `Bezpłatne lub poziom ceny 0: ${freeCount} miejsc (${freePercent}% katalogu).`,
  )
  lines.push(
    `W bazie jest ${events.length} nadchodzących wydarzeń i ${routes.length} tras.`,
  )

  return lines.map((text, index) => ({ id: `insight-${index}`, text }))
}

export type EventPreviewRow = {
  id: number
  date: string
  name: string
  location: string
  category: string
}

export function upcomingEventsPreview(events: CatalogEvent[], limit = 12): EventPreviewRow[] {
  return [...events]
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, limit)
    .map((event) => ({
      id: event.id,
      date: event.start_time ? `${event.start_date} ${event.start_time}` : event.start_date,
      name: event.name,
      location: event.venue_name ?? event.gmina ?? event.city ?? '—',
      category: categoryLabel(event.category),
    }))
}

export function uniqueCategories(places: CatalogPlace[]): string[] {
  const set = new Set<string>()
  for (const place of places) {
    set.add(categoryLabel(place.category))
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'pl'))
}
