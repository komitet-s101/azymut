import type { RouteSummary } from '@/lib/routeApi'

function apiBase(): string {
  const configured = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  return configured.replace(/\/$/, '')
}

type Paginated<T> = {
  items: T[]
  total: number
  limit: number
  offset: number
}

export type CatalogPlace = {
  id: number
  name: string
  city: string
  gmina: string
  category: string | null
  is_indoor: boolean
  is_outdoor: boolean
  price_level: number | null
  verification_status: string | null
  typical_visit_minutes: number | null
}

export type CatalogEvent = {
  id: number
  name: string
  start_date: string
  start_time: string | null
  city: string | null
  gmina: string | null
  venue_name: string | null
  category: string | null
  price_level: number | null
}

async function fetchAllPages<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T[]> {
  const collected: T[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const url = `${apiBase()}${path}${path.includes('?') ? '&' : '?'}limit=${limit}&offset=${offset}`
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal,
    })
    if (!response.ok) {
      throw new Error('Nie udało się pobrać danych katalogu.')
    }
    const data = (await response.json()) as Paginated<T>
    collected.push(...data.items)
    if (offset + data.items.length >= data.total || data.items.length === 0) {
      break
    }
    offset += limit
  }

  return collected
}

export async function fetchCatalogPlaces(signal?: AbortSignal): Promise<CatalogPlace[]> {
  return fetchAllPages<CatalogPlace>('/api/v1/places', signal)
}

export async function fetchCatalogEvents(signal?: AbortSignal): Promise<CatalogEvent[]> {
  return fetchAllPages<CatalogEvent>('/api/v1/events?upcoming_only=true', signal)
}

export async function fetchCatalogRoutes(signal?: AbortSignal): Promise<RouteSummary[]> {
  return fetchAllPages<RouteSummary>('/api/v1/routes', signal)
}
