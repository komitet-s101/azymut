import type { TrailStop } from '@/lib/trail'

export type WalkingRoute = {
  positions: [number, number][]
  distanceKm: number
  durationMinutes: number | null
  followsRoads: boolean
}

function apiBase(): string {
  const configured = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  return configured.replace(/\/$/, '')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function mergeLegPositions(
  merged: [number, number][],
  leg: [number, number][],
): [number, number][] {
  if (leg.length === 0) {
    return merged
  }
  if (merged.length === 0) {
    return [...leg]
  }
  const last = merged[merged.length - 1]
  const first = leg[0]
  if (last[0] === first[0] && last[1] === first[1]) {
    return [...merged, ...leg.slice(1)]
  }
  return [...merged, ...leg]
}

async function fetchWalkingRouteOnce(
  stops: TrailStop[],
  signal?: AbortSignal,
): Promise<WalkingRoute> {
  const response = await fetch(`${apiBase()}/api/v1/routing/walk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      waypoints: stops.map((stop) => ({ lat: stop.lat, lon: stop.lon })),
    }),
    signal,
  })
  if (!response.ok) {
    throw new Error('Nie udało się wyznaczyć trasy pieszej.')
  }
  const data = (await response.json()) as {
    coordinates: [number, number][]
    distance_km: number
    duration_minutes: number | null
  }
  if (!data.coordinates || data.coordinates.length < 2) {
    throw new Error('Brak geometrii trasy.')
  }
  return {
    positions: data.coordinates,
    distanceKm: data.distance_km,
    durationMinutes: data.duration_minutes,
    followsRoads: true,
  }
}

async function fetchWalkingRouteChained(
  stops: TrailStop[],
  signal?: AbortSignal,
): Promise<WalkingRoute> {
  let positions: [number, number][] = []
  let distanceKm = 0
  let durationMinutes = 0
  let hasDuration = true

  for (let index = 0; index < stops.length - 1; index += 1) {
    const legStops = [stops[index], stops[index + 1]]
    const leg = await fetchWalkingRouteOnce(legStops, signal)
    positions = mergeLegPositions(positions, leg.positions)
    distanceKm += leg.distanceKm
    if (leg.durationMinutes === null) {
      hasDuration = false
    } else {
      durationMinutes += leg.durationMinutes
    }
  }

  if (positions.length < 2) {
    throw new Error('Brak geometrii trasy.')
  }

  return {
    positions,
    distanceKm,
    durationMinutes: hasDuration ? durationMinutes : null,
    followsRoads: true,
  }
}

/** Pieszy routing OSRM przez backend; kilka prób przy chwilowych błędach sieci. */
export async function fetchWalkingRoute(
  stops: TrailStop[],
  signal?: AbortSignal,
  maxAttempts = 5,
): Promise<WalkingRoute> {
  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }
    try {
      return await fetchWalkingRouteOnce(stops, signal)
    } catch (error: unknown) {
      lastError = error
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }
      if (attempt < maxAttempts - 1) {
        await sleep(350 * (attempt + 1))
      }
    }
  }

  if (stops.length > 2) {
    try {
      return await fetchWalkingRouteChained(stops, signal)
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }
      lastError = error
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Nie udało się wyznaczyć trasy pieszej.')
}

export function straightLineRoute(stops: TrailStop[]): WalkingRoute {
  const positions = stops.map((stop) => [stop.lat, stop.lon] as [number, number])
  let distanceKm = 0
  for (let index = 1; index < stops.length; index += 1) {
    const prev = stops[index - 1]
    const next = stops[index]
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const earthKm = 6371
    const dLat = toRad(next.lat - prev.lat)
    const dLon = toRad(next.lon - prev.lon)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(prev.lat)) * Math.cos(toRad(next.lat)) * Math.sin(dLon / 2) ** 2
    distanceKm += earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }
  return {
    positions,
    distanceKm,
    durationMinutes: null,
    followsRoads: false,
  }
}
