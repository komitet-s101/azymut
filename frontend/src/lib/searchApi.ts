import { apiBase } from '@/lib/apiBase'
import type { TouristGeographyScope, UserContextLocal } from '@/types/userContext'

export type SearchResult = {
  kind: 'place' | 'event'
  id: number
  external_id: string | null
  name: string
  category: string | null
  city: string | null
  score: number
  reason: string | null
  flags: string[]
  price_level: number | null
  typical_visit_minutes: number | null
  address_line: string | null
  latitude: number | null
  longitude: number | null
  start_date: string | null
  start_time: string | null
}

export type SearchUserPreferencesPayload = {
  persona?: UserContextLocal['persona']
  interest_tag_ids?: string[]
  profile?: UserContextLocal['profile']
  constraints?: UserContextLocal['constraints']
  tourist_geography_scope?: TouristGeographyScope
}

export type SearchFilterOut = {
  time_budget_minutes: number | null
  stop_count: number | null
}

export type SearchResponse = {
  query: string
  summary: string
  parser: 'llm' | 'rules'
  weather_note: string | null
  weather_raining: boolean
  filter: SearchFilterOut
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

export function searchPreferencesFromContext(
  context: UserContextLocal | null,
): SearchUserPreferencesPayload | undefined {
  if (!context?.onboarding_completed_at) {
    return undefined
  }
  return {
    persona: context.persona,
    interest_tag_ids: context.interest_tag_ids,
    profile: context.profile,
    constraints: context.constraints,
    tourist_geography_scope: context.tourist_geography_scope ?? undefined,
  }
}

export async function searchNaturalLanguage(
  query: string,
  signal?: AbortSignal,
  userPreferences?: SearchUserPreferencesPayload,
): Promise<SearchResponse> {
  const body: {
    query: string
    user_preferences?: SearchUserPreferencesPayload
  } = { query }
  if (userPreferences) {
    body.user_preferences = userPreferences
  }
  const response = await fetch(`${apiBase()}/api/v1/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
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
