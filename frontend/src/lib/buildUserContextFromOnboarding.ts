import {
  categoryToPackageId,
  CUSTOM_INTEREST_ID,
} from '@/data/interestCategories'
import type {
  Persona,
  TouristGeographyScope,
  UserContextLocal,
  UserProfile,
} from '@/types/userContext'

const ADULT_AGE_THRESHOLD = 18

export type OnboardingFormState = {
  persona: Persona | null
  interestTagIds: string[]
  age: string
  hasChildren: boolean
  childrenCount: string
  customInterests: string
  preferOutdoor: boolean
  selectedRouteId: number | null
  touristGeographyScope: TouristGeographyScope
}

const defaultProfile: UserProfile = {
  bmi: null,
  likes_games: 2,
  prefer_outdoor: true,
  gastro_intensity_preference: 2,
  physical_activity_preference: 3,
}

function pickPrimaryPackageId(
  persona: Persona,
  tagIds: string[],
): string {
  const categories = tagIds.filter((id) => id !== CUSTOM_INTEREST_ID)
  if (categories.length > 0) {
    return categoryToPackageId(categories[0], persona)
  }
  if (tagIds.includes(CUSTOM_INTEREST_ID)) {
    return persona === 'tourist' ? 'culture_walk' : 'family_fun'
  }
  return persona === 'tourist' ? 'culture_walk' : 'family_fun'
}

function mergeProfileFromTags(tagIds: string[], preferOutdoor: boolean): UserProfile {
  const profile: UserProfile = { ...defaultProfile, prefer_outdoor: preferOutdoor }

  if (tagIds.includes('sport_aktywny_wypoczynek') || tagIds.includes('zabawa_gry_adrenalina')) {
    profile.physical_activity_preference = 5
    profile.likes_games = Math.max(profile.likes_games, 4)
  }
  if (tagIds.includes('jedzenie_lokalne_smaki')) {
    profile.gastro_intensity_preference = 5
  }
  if (tagIds.includes('przyroda_spacery_widoki')) {
    profile.prefer_outdoor = true
    profile.physical_activity_preference = Math.max(profile.physical_activity_preference, 4)
  }
  if (tagIds.includes('relaks_wypoczynek')) {
    profile.physical_activity_preference = 1
  }
  if (tagIds.includes('warsztaty_nauka_pasje')) {
    profile.likes_games = Math.max(profile.likes_games, 3)
  }

  return profile
}

const DEFAULT_CHILD_AGE = 8

function parseChildrenCount(value: string): number {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 0
  }
  return Math.min(parsed, 12)
}

function buildParty(age: number | null, hasChildren: boolean, childrenCount: string) {
  const adults = 1
  const count =
    age !== null && age >= ADULT_AGE_THRESHOLD && hasChildren
      ? parseChildrenCount(childrenCount)
      : 0
  const kidsAges =
    count > 0 ? Array.from({ length: count }, () => DEFAULT_CHILD_AGE) : []
  return { adults, kids_ages: kidsAges }
}

export function onboardingFormFromUserContext(
  context: UserContextLocal,
): OnboardingFormState {
  const kids = context.constraints.party.kids_ages
  const hasChildren = kids.length > 0

  return {
    persona: context.persona,
    interestTagIds: [...context.interest_tag_ids],
    age: context.age !== null ? String(context.age) : '',
    hasChildren,
    childrenCount: hasChildren ? String(kids.length) : '',
    customInterests: context.interest_tag_ids.includes(CUSTOM_INTEREST_ID)
      ? context.custom_request
      : '',
    preferOutdoor: context.profile.prefer_outdoor,
    selectedRouteId: context.onboarding_route_id,
    touristGeographyScope: context.tourist_geography_scope ?? 'plock_city',
  }
}

export function buildUserContextFromOnboarding(
  form: OnboardingFormState,
): UserContextLocal | null {
  if (!form.persona || form.interestTagIds.length === 0) {
    return null
  }

  const ageParsed = Number.parseInt(form.age, 10)
  const age = Number.isFinite(ageParsed) && ageParsed > 0 ? ageParsed : null
  const now = new Date()

  return {
    schema_version: 1,
    persona: form.persona,
    interest_package_id: pickPrimaryPackageId(form.persona, form.interestTagIds),
    custom_request: form.customInterests.trim(),
    constraints: {
      budget_max_pln: 0,
      available_minutes: 180,
      day_of_week: now.getDay(),
      window_start: '10:00',
      window_end: '18:00',
      party: buildParty(age, form.hasChildren, form.childrenCount),
    },
    profile: mergeProfileFromTags(form.interestTagIds, form.preferOutdoor),
    last_plan_id: null,
    age,
    interest_tag_ids: form.interestTagIds,
    onboarding_route_id:
      form.persona === 'tourist' && form.selectedRouteId !== null
        ? form.selectedRouteId
        : null,
    tourist_geography_scope:
      form.persona === 'tourist' ? form.touristGeographyScope : null,
    onboarding_completed_at: new Date().toISOString(),
  }
}
