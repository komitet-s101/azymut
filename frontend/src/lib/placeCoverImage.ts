import type { PlaceDetail } from '@/lib/placeApi'

/** Gdy w API pojawi się pole zdjęcia (np. image_url), podłączymy je tutaj. */
export function resolvePlaceCoverImageUrl(detail: PlaceDetail | null): string | null {
  if (!detail) {
    return null
  }
  const candidate = detail as PlaceDetail & { image_url?: string | null }
  const url = candidate.image_url?.trim()
  return url ? url : null
}
