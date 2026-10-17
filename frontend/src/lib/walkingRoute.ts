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

export async function fetchWalkingRoute(
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
  return {
    positions: data.coordinates,
    distanceKm: data.distance_km,
    durationMinutes: data.duration_minutes,
    followsRoads: true,
  }
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
