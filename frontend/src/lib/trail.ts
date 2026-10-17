import type { SearchResult } from '@/lib/searchApi'

export type TrailStop = {
  key: string
  order: number
  lat: number
  lon: number
  result: SearchResult
}

const MAX_STOPS = 4

export function resultKey(item: SearchResult): string {
  return `${item.kind}-${item.id}`
}

function hasCoords(item: SearchResult): boolean {
  return (
    typeof item.latitude === 'number' &&
    typeof item.longitude === 'number' &&
    Number.isFinite(item.latitude) &&
    Number.isFinite(item.longitude)
  )
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const earthKm = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function orderNearestNeighbor(stops: SearchResult[]): SearchResult[] {
  if (stops.length <= 1) {
    return stops
  }
  const remaining = [...stops.slice(1)]
  const ordered: SearchResult[] = [stops[0]]
  let current = stops[0]

  while (remaining.length > 0) {
    let bestIndex = 0
    let bestDistance = Infinity
    for (let index = 0; index < remaining.length; index += 1) {
      const candidate = remaining[index]
      const distance = haversineKm(
        current.latitude!,
        current.longitude!,
        candidate.latitude!,
        candidate.longitude!,
      )
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    }
    const next = remaining.splice(bestIndex, 1)[0]
    ordered.push(next)
    current = next
  }
  return ordered
}

export function buildTrail(results: SearchResult[]): TrailStop[] {
  const withCoords = results.filter(hasCoords).slice(0, MAX_STOPS)
  if (withCoords.length === 0) {
    return []
  }
  const ordered = orderNearestNeighbor(withCoords)
  return ordered.map((result, index) => ({
    key: resultKey(result),
    order: index + 1,
    lat: result.latitude!,
    lon: result.longitude!,
    result,
  }))
}

export function trailPathKm(stops: TrailStop[]): number {
  let total = 0
  for (let index = 1; index < stops.length; index += 1) {
    const prev = stops[index - 1]
    const next = stops[index]
    total += haversineKm(prev.lat, prev.lon, next.lat, next.lon)
  }
  return total
}

export function trailVisitMinutes(stops: TrailStop[]): number {
  return stops.reduce((sum, stop) => sum + (stop.result.typical_visit_minutes ?? 30), 0)
}
