import { fetchPlaceDetail } from '@/lib/placeApi'
import type { RouteDetail, RoutePlaceSummary, RouteStop } from '@/lib/routeApi'
import type { SearchResult } from '@/lib/searchApi'
import type { TrailStop } from '@/lib/trail'
import { resultKey } from '@/lib/trail'

function coerceCoord(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function hasCoords(place: RoutePlaceSummary): boolean {
  return coerceCoord(place.latitude) !== null && coerceCoord(place.longitude) !== null
}

function normalizedPlace(place: RoutePlaceSummary): RoutePlaceSummary {
  return {
    ...place,
    latitude: coerceCoord(place.latitude),
    longitude: coerceCoord(place.longitude),
  }
}

async function enrichStopPlace(
  stop: RouteStop,
  signal?: AbortSignal,
): Promise<RouteStop> {
  const place = normalizedPlace(stop.place)
  if (hasCoords(place)) {
    return { ...stop, place }
  }
  try {
    const detail = await fetchPlaceDetail(place.id, signal)
    const lat = coerceCoord(detail.latitude)
    const lon = coerceCoord(detail.longitude)
    if (lat === null || lon === null) {
      return { ...stop, place }
    }
    return {
      ...stop,
      place: {
        ...place,
        name: detail.name || place.name,
        latitude: lat,
        longitude: lon,
        typical_visit_minutes:
          detail.typical_visit_minutes ?? place.typical_visit_minutes,
      },
    }
  } catch {
    return { ...stop, place }
  }
}

/** Uzupełnia współrzędne przystanków (np. gdy summary ich nie ma). */
export async function enrichRouteDetailForMap(
  route: RouteDetail,
  signal?: AbortSignal,
): Promise<RouteDetail> {
  const stops = await Promise.all(
    route.stops.map((stop) => enrichStopPlace(stop, signal)),
  )
  return { ...route, stops }
}

function placeToSearchResult(
  place: RoutePlaceSummary,
  routeCategory: string | null,
  routeCity: string,
  dwellMinutes: number | null,
): SearchResult {
  const city = routeCity.split('/')[0]?.trim() || routeCity.trim() || null
  const visit =
    dwellMinutes ??
    place.typical_visit_minutes ??
    null
  return {
    kind: 'place',
    id: place.id,
    name: place.name,
    category: routeCategory,
    city,
    score: 0,
    reason: null,
    flags: [],
    price_level: null,
    typical_visit_minutes: visit,
    address_line: null,
    latitude: place.latitude,
    longitude: place.longitude,
    start_date: null,
    start_time: null,
  }
}

export function routeStopsToTrail(route: RouteDetail): TrailStop[] {
  const ordered = [...route.stops].sort((a, b) => a.sequence - b.sequence)
  const stops: TrailStop[] = []

  for (const stop of ordered) {
    const place = normalizedPlace(stop.place)
    if (!hasCoords(place)) {
      continue
    }
    const lat = place.latitude as number
    const lon = place.longitude as number
    const result = placeToSearchResult(
      place,
      route.category,
      route.city,
      stop.dwell_minutes,
    )
    stops.push({
      key: resultKey(result),
      order: stops.length + 1,
      lat,
      lon,
      result,
    })
  }

  return stops
}

function formatDurationBrief(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60
    return rest > 0 ? `ok. ${hours} h ${rest} min` : `ok. ${hours} h`
  }
  return `ok. ${minutes} min`
}

/** Krótki podtytuł pod „Twój plan na dziś” — bez długiego opisu (szczegóły w callout). */
export function routeHeroLead(route: RouteDetail): string {
  const duration = formatDurationBrief(route.duration_minutes_approx)
  const stops =
    route.stops_min === route.stops_max
      ? `${route.stops_min} przystanków`
      : `${route.stops_min}–${route.stops_max} przystanków`
  const city = route.city?.split(/[/;]/)[0]?.trim()
  return [duration, stops, city].filter(Boolean).join(' · ')
}
