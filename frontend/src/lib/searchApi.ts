export type SearchResult = {
  kind: 'place' | 'event'
  id: number
  name: string
  category: string | null
  city: string | null
  score: number
  reason: string | null
  flags: string[]
  price_level: number | null
  typical_visit_minutes: number | null
  address_line: string | null
  start_date: string | null
  start_time: string | null
}

export type SearchResponse = {
  query: string
  summary: string
  parser: 'llm' | 'rules'
  weather_note: string | null
  weather_raining: boolean
  results: SearchResult[]
}

const CATEGORY_LABELS: Record<string, string> = {
  historia_zabytki: 'Historia',
  sport_aktywny_wypoczynek: 'Sport',
  sakralne_wielokulturowosc: 'Sakralne',
  warsztaty_nauka_pasje: 'Warsztaty',
  przyroda_spacery_widoki: 'Przyroda',
  jedzenie_lokalne_smaki: 'Jedzenie',
  zabawa_gry_adrenalina: 'Zabawa',
  kibicowanie_wydarzenia_sportowe: 'Kibicowanie',
  kultura_sztuka_film: 'Kultura',
  muzyka_widowiska: 'Muzyka',
  relaks_wypoczynek: 'Relaks',
  rzemioslo_pamiatki_produkty: 'Rzemiosło',
  festiwale_lokalne_swieta: 'Festiwal',
}

export function categoryLabel(category: string | null): string {
  if (!category) {
    return 'Propozycja'
  }
  return CATEGORY_LABELS[category] ?? category
}

export function priceLabel(level: number | null, flags: string[]): string {
  if (flags.includes('price_unconfirmed') || level === null) {
    return 'Cena niepotwierdzona'
  }
  if (level === 0) {
    return 'Bezpłatne'
  }
  if (level === 1) {
    return 'Niska cena'
  }
  if (level === 2) {
    return 'Średnia cena'
  }
  return 'Wyższa cena'
}

function apiBase(): string {
  const configured = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  return configured.replace(/\/$/, '')
}

export async function searchNaturalLanguage(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  const response = await fetch(`${apiBase()}/api/v1/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query }),
    signal,
  })
  if (!response.ok) {
    let message = 'Nie udało się wyszukać.'
    try {
      const body = (await response.json()) as { error?: { message?: string } }
      if (body.error?.message) {
        message = body.error.message
      }
    } catch {
      message = 'Nie udało się wyszukać.'
    }
    throw new Error(message)
  }
  return (await response.json()) as SearchResponse
}
