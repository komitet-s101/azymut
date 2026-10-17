import type { SearchResult } from '@/lib/searchApi'

export type TrailStop = {
  key: string
  order: number
  lat: number
  lon: number
  result: SearchResult
}

export type TrailMode = 'event' | 'place'

export type TrailPlan = {
  stops: TrailStop[]
  mode: TrailMode | null
}

const MAX_STOPS = 4
/** Maks. odległość między kolejnymi przystankami szlaku miejsc (km). */
const MAX_LEG_KM = 6
/** Maks. rozpiętość całego szlaku miejsc (km). */
const MAX_SPAN_KM = 12

const FOLD_FROM = 'ąćęłńóśźż'
const FOLD_TO = 'acelnoszz'

const EVENT_QUERY_RE =
  /\b(wydarzen\w*|koncert\w*|spektakl\w*|mecz\w*|festiwal\w*|jarmark\w*|repertuar\w*|pokaz\w*|wystep\w*|bilet\w*|kino\w*|film\w*|teatr\w*|kibic\w*|liga|derby)\b/

export function resultKey(item: SearchResult): string {
  return `${item.kind}-${item.id}`
}

function fold(text: string): string {
  let out = text.toLowerCase()
  for (let index = 0; index < FOLD_FROM.length; index += 1) {
    out = out.replaceAll(FOLD_FROM[index], FOLD_TO[index])
  }
  return out.replace(/\s+/g, ' ').trim()
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

function distanceBetween(a: SearchResult, b: SearchResult): number {
  return haversineKm(a.latitude!, a.longitude!, b.latitude!, b.longitude!)
}

function maxSpanKm(items: SearchResult[]): number {
  let max = 0
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      max = Math.max(max, distanceBetween(items[i], items[j]))
    }
  }
  return max
}

export function queryEventIntent(query: string, results: SearchResult[]): boolean {
  const text = fold(query)
  if (EVENT_QUERY_RE.test(text)) {
    return true
  }
  const top = results.slice(0, 6)
  const events = top.filter((item) => item.kind === 'event')
  if (events.length === 0) {
    return false
  }
  const topEvent = events[0]
  const topPlace = top.find((item) => item.kind === 'place')
  if (top[0]?.kind === 'event') {
    return true
  }
  if (topEvent.score >= (topPlace?.score ?? 0) + 1) {
    return true
  }
  return top.filter((item) => item.kind === 'event').length >= 2
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
      const distance = distanceBetween(current, remaining[index])
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

function orderEventsByTime(events: SearchResult[]): SearchResult[] {
  const timed = events.every((event) => Boolean(event.start_time))
  if (!timed) {
    return orderNearestNeighbor(events)
  }
  return [...events].sort((left, right) =>
    (left.start_time ?? '').localeCompare(right.start_time ?? ''),
  )
}

function toTrailStops(ordered: SearchResult[]): TrailStop[] {
  return ordered.map((result, index) => ({
    key: resultKey(result),
    order: index + 1,
    lat: result.latitude!,
    lon: result.longitude!,
    result,
  }))
}

function pickEventTrail(events: SearchResult[]): SearchResult[] {
  const withCoords = events.filter(hasCoords).slice(0, MAX_STOPS)
  if (withCoords.length === 0) {
    return []
  }
  return orderEventsByTime(withCoords)
}

function pickCoherentPlaceCluster(places: SearchResult[]): SearchResult[] {
  const withCoords = places.filter(hasCoords)
  if (withCoords.length === 0) {
    return []
  }
  if (withCoords.length === 1) {
    return withCoords
  }

  const cluster: SearchResult[] = [withCoords[0]]
  let current = withCoords[0]
  const remaining = withCoords.slice(1)

  while (cluster.length < MAX_STOPS && remaining.length > 0) {
    let bestIndex = -1
    let bestDistance = Infinity
    for (let index = 0; index < remaining.length; index += 1) {
      const distance = distanceBetween(current, remaining[index])
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    }
    if (bestIndex < 0 || bestDistance > MAX_LEG_KM) {
      break
    }
    const candidate = remaining[bestIndex]
    const trial = [...cluster, candidate]
    if (maxSpanKm(trial) > MAX_SPAN_KM) {
      break
    }
    cluster.push(candidate)
    remaining.splice(bestIndex, 1)
    current = candidate
  }

  if (cluster.length >= 2) {
    return orderNearestNeighbor(cluster)
  }

  const nearestOther = withCoords[1]
  if (nearestOther && distanceBetween(withCoords[0], nearestOther) <= MAX_LEG_KM) {
    return orderNearestNeighbor([withCoords[0], nearestOther]).slice(0, MAX_STOPS)
  }

  return []
}

export function buildTrail(results: SearchResult[], query: string): TrailPlan {
  const events = results.filter((item) => item.kind === 'event')
  const places = results.filter((item) => item.kind === 'place')
  const eventIntent = queryEventIntent(query, results)

  if (eventIntent) {
    const ordered = pickEventTrail(events)
    if (ordered.length === 0) {
      return { stops: [], mode: null }
    }
    return { stops: toTrailStops(ordered), mode: 'event' }
  }

  const ordered = pickCoherentPlaceCluster(places)
  if (ordered.length === 0) {
    return { stops: [], mode: null }
  }
  return { stops: toTrailStops(ordered), mode: 'place' }
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
  return stops.reduce((sum, stop) => {
    if (stop.result.kind === 'event') {
      return sum + (stop.result.typical_visit_minutes ?? 120)
    }
    return sum + (stop.result.typical_visit_minutes ?? 30)
  }, 0)
}
