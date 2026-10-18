import { CUSTOM_INTEREST_ID } from '@/data/interestCategories'
import type { SearchResult, SearchUserPreferencesPayload } from '@/lib/searchApi'

export type HomeRecommendedPlacesResponse = {
  places: SearchResult[]
}

type CatalogPlace = {
  id: number
  external_id: string | null
  name: string
  category: string | null
  city: string | null
  price_level: number | null
  typical_visit_minutes: number | null
  address_line: string | null
  latitude: number | null
  longitude: number | null
}

type PaginatedPlaces = {
  items: CatalogPlace[]
}

function apiBase(): string {
  const configured = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  return configured.replace(/\/$/, '')
}

function interestCategories(prefs?: SearchUserPreferencesPayload): string[] {
  return (prefs?.interest_tag_ids ?? []).filter((id) => id !== CUSTOM_INTEREST_ID)
}

function homeCity(prefs?: SearchUserPreferencesPayload): string | undefined {
  if (prefs?.tourist_geography_scope === 'plock_region') {
    return undefined
  }
  return 'Płock'
}

function toSearchResult(place: CatalogPlace, score: number): SearchResult {
  return {
    kind: 'place',
    id: place.id,
    external_id: place.external_id,
    name: place.name,
    category: place.category,
    city: place.city,
    score,
    reason: null,
    flags: place.price_level === null ? ['price_unconfirmed'] : [],
    price_level: place.price_level,
    typical_visit_minutes: place.typical_visit_minutes,
    address_line: place.address_line,
    latitude: place.latitude,
    longitude: place.longitude,
    start_date: null,
    start_time: null,
  }
}

async function listPlacesByCategory(
  category: string,
  options: { city?: string; limit: number; signal?: AbortSignal },
): Promise<CatalogPlace[]> {
  const params = new URLSearchParams({
    category,
    limit: String(options.limit),
    offset: '0',
  })
  if (options.city) {
    params.set('city', options.city)
  }
  const response = await fetch(`${apiBase()}/api/v1/places?${params}`, {
    headers: { Accept: 'application/json' },
    signal: options.signal,
  })
  if (!response.ok) {
    throw new Error('Nie udało się załadować miejsc.')
  }
  const data = (await response.json()) as PaginatedPlaces
  return data.items
}

async function fetchRecommendedPlacesViaHomeApi(
  limit: number,
  userPreferences: SearchUserPreferencesPayload | undefined,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const body: {
    limit: number
    user_preferences?: SearchUserPreferencesPayload
  } = { limit }
  if (userPreferences) {
    body.user_preferences = userPreferences
  }
  const response = await fetch(`${apiBase()}/api/v1/home/recommended-places`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!response.ok) {
    throw new Error('Nie udało się załadować miejsc.')
  }
  const data = (await response.json()) as HomeRecommendedPlacesResponse
  return data.places
}

export async function fetchRecommendedPlacesForHome(
  options: {
    limit?: number
    userPreferences?: SearchUserPreferencesPayload
    signal?: AbortSignal
  } = {},
): Promise<SearchResult[]> {
  const limit = options.limit ?? 6
  const categories = interestCategories(options.userPreferences)
  if (categories.length === 0) {
    return []
  }

  const city = homeCity(options.userPreferences)
  const perCategory = Math.max(2, Math.ceil(limit / categories.length))
  const seen = new Set<number>()
  const merged: SearchResult[] = []

  for (const category of categories) {
    const items = await listPlacesByCategory(category, {
      city,
      limit: perCategory,
      signal: options.signal,
    })
    for (const place of items) {
      if (seen.has(place.id)) {
        continue
      }
      seen.add(place.id)
      merged.push(toSearchResult(place, limit - merged.length))
      if (merged.length >= limit) {
        return merged
      }
    }
  }

  if (merged.length > 0) {
    return merged
  }

  return fetchRecommendedPlacesViaHomeApi(limit, options.userPreferences, options.signal)
}
