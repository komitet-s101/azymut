import type { PlaceDetail } from '@/lib/placeApi'

const photoModules = import.meta.glob<string>('../assets/photo/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const placePhotoByExternalId: Record<string, string> = {}
for (const [path, url] of Object.entries(photoModules)) {
  const match = /\/([^/]+)\.jpg$/.exec(path)
  if (match?.[1]) {
    placePhotoByExternalId[match[1]] = url
  }
}

export type PlaceCoverInput = {
  external_id?: string | null
  image_url?: string | null
}

export function resolvePlacePhotoByExternalId(externalId: string | null | undefined): string | null {
  const id = externalId?.trim()
  if (!id) {
    return null
  }
  return placePhotoByExternalId[id] ?? null
}

/** Lokalne pliki w `src/assets/photo/{external_id}.jpg` lub pole API `image_url`. */
export function resolvePlaceCoverImageUrl(
  source: PlaceDetail | PlaceCoverInput | null,
): string | null {
  if (!source) {
    return null
  }
  const apiUrl = source.image_url?.trim()
  if (apiUrl) {
    return apiUrl
  }
  return resolvePlacePhotoByExternalId(source.external_id)
}
