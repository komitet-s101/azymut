export type Persona = 'tourist' | 'resident'

/** Zakres planowania turysty: sam Płock vs okolice (gminy regionu). */
export type TouristGeographyScope = 'plock_city' | 'plock_region'

export type PartyConstraints = {
  adults: number
  kids_ages: number[]
}

export type UserConstraints = {
  budget_max_pln: number
  available_minutes: number
  day_of_week: number
  window_start: string
  window_end: string
  party: PartyConstraints
}

export type UserProfile = {
  bmi: number | null
  likes_games: number
  prefer_outdoor: boolean
  gastro_intensity_preference: number
  physical_activity_preference: number
}

/** Zgodne z `POST /api/v1/plan` (backend.api.schemas.plan.UserContext). */
export type UserContext = {
  schema_version: 1
  persona: Persona
  interest_package_id: string
  custom_request: string
  constraints: UserConstraints
  profile: UserProfile
  last_plan_id: string | null
}

/** Pola tylko na kliencie (nie wysyłane do API bez mapowania). */
export type UserContextLocal = UserContext & {
  age: number | null
  interest_tag_ids: string[]
  onboarding_route_id: number | null
  tourist_geography_scope: TouristGeographyScope | null
  onboarding_completed_at: string | null
}
