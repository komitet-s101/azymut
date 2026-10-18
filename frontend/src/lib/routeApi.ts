function apiBase(): string {
  const configured = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  return configured.replace(/\/$/, '')
}

export type RoutePlaceSummary = {
  id: number
  external_id: string | null
  name: string
  latitude: number | null
  longitude: number | null
  typical_visit_minutes: number | null
}

export type RouteSummary = {
  id: number
  external_id: string | null
  name: string
  description: string | null
  duration_minutes_approx: number
  stops_min: number
  stops_max: number
  city: string
  gmina: string
  price_level_max: number | null
  route_type: string | null
  category: string | null
  source_url: string | null
}

export type RouteStop = {
  sequence: number
  dwell_minutes: number | null
  place: RoutePlaceSummary
}

export type RouteDetail = RouteSummary & {
  stops: RouteStop[]
}

type PaginatedRoutes = {
  items: RouteSummary[]
  total: number
  limit: number
  offset: number
}

export async function listRoutes(
  options: { limit?: number; signal?: AbortSignal } = {},
): Promise<RouteSummary[]> {
  const limit = options.limit ?? 100
  const response = await fetch(`${apiBase()}/api/v1/routes?limit=${limit}`, {
    headers: { Accept: 'application/json' },
    signal: options.signal,
  })
  if (!response.ok) {
    throw new Error('Nie udało się pobrać tras.')
  }
  const data = (await response.json()) as PaginatedRoutes
  return data.items
}

export async function fetchRouteDetail(
  routeId: number,
  signal?: AbortSignal,
): Promise<RouteDetail> {
  const response = await fetch(`${apiBase()}/api/v1/routes/${routeId}`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) {
    throw new Error('Nie udało się pobrać szczegółów trasy.')
  }
  return (await response.json()) as RouteDetail
}
