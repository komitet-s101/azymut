import type { SearchResult, SearchUserPreferencesPayload } from '@/lib/searchApi'

export type HomeUpcomingEventsResponse = {
  events: SearchResult[]
}

function apiBase(): string {
  const configured = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  return configured.replace(/\/$/, '')
}

export async function fetchUpcomingEventsForHome(
  options: {
    limit?: number
    userPreferences?: SearchUserPreferencesPayload
    signal?: AbortSignal
  } = {},
): Promise<SearchResult[]> {
  const limit = options.limit ?? 4
  const body: {
    limit: number
    user_preferences?: SearchUserPreferencesPayload
  } = { limit }
  if (options.userPreferences) {
    body.user_preferences = options.userPreferences
  }
  const response = await fetch(`${apiBase()}/api/v1/home/upcoming-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    signal: options.signal,
  })
  if (!response.ok) {
    throw new Error('Nie udało się załadować wydarzeń.')
  }
  const data = (await response.json()) as HomeUpcomingEventsResponse
  return data.events
}
