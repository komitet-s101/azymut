import { apiBase } from '@/lib/apiBase'

export type PlaceDetail = {
  id: number
  external_id: string | null
  name: string
  description: string | null
  city: string | null
  address_line: string | null
  category: string | null
  price_level: number | null
  typical_visit_minutes: number | null
  latitude: number | null
  longitude: number | null
  official_url: string | null
  booking_url: string | null
  image_url?: string | null
}

export async function fetchPlaceDetail(placeId: number, signal?: AbortSignal): Promise<PlaceDetail> {
  const response = await fetch(`${apiBase()}/api/v1/places/${placeId}`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) {
    throw new Error('Nie udało się pobrać szczegółów miejsca.')
  }
  return (await response.json()) as PlaceDetail
}
