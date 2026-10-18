import { CUSTOM_INTEREST_ID } from '@/data/interestCategories'
import type { RouteSummary } from '@/lib/routeApi'
import { type TouristGeographyScope, touristRouteCatalog } from '@/lib/touristRoutes'

const FOR_YOU_LIMIT = 8
const OTHER_ROUTES_LIMIT = 6

export type OnboardingRouteSuggestions = {
  forYou: RouteSummary[]
  other: RouteSummary[]
}

function routeKindRank(route: RouteSummary): number {
  const id = route.external_id?.trim() ?? ''
  if (id.startsWith('DAY-R')) {
    return 0
  }
  if (id.startsWith('PLK-R')) {
    return 1
  }
  if (id.startsWith('REG-R')) {
    return 2
  }
  return 3
}

function compareRoutes(a: RouteSummary, b: RouteSummary): number {
  const aKind = routeKindRank(a)
  const bKind = routeKindRank(b)
  if (aKind !== bKind) {
    return aKind - bKind
  }
  const aOfficial = a.route_type === 'official' ? 0 : 1
  const bOfficial = b.route_type === 'official' ? 0 : 1
  if (aOfficial !== bOfficial) {
    return aOfficial - bOfficial
  }
  if (a.duration_minutes_approx !== b.duration_minutes_approx) {
    return a.duration_minutes_approx - b.duration_minutes_approx
  }
  return a.name.localeCompare(b.name, 'pl')
}


function pickOnePerInterestTag(
  pool: RouteSummary[],
  tags: string[],
): RouteSummary[] {
  const picked: RouteSummary[] = []
  const usedIds = new Set<number>()

  for (const tag of tags) {
    const match = pool
      .filter((route) => route.category === tag && !usedIds.has(route.id))
      .sort(compareRoutes)[0]
    if (match) {
      picked.push(match)
      usedIds.add(match.id)
    }
  }

  for (const route of [...pool].sort(compareRoutes)) {
    if (picked.length >= FOR_YOU_LIMIT) {
      break
    }
    if (!usedIds.has(route.id)) {
      picked.push(route)
      usedIds.add(route.id)
    }
  }

  return picked
}

function buildForYouRoutes(catalog: RouteSummary[], tags: string[]): RouteSummary[] {
  if (tags.length > 0) {
    const matching = catalog.filter(
      (route) => route.category !== null && tags.includes(route.category),
    )
    if (matching.length > 0) {
      return pickOnePerInterestTag(matching, tags).slice(0, FOR_YOU_LIMIT)
    }
  }

  const fallback = catalog.filter((route) => route.route_type === 'official')
  const pool = fallback.length > 0 ? fallback : [...catalog]
  return [...pool].sort(compareRoutes).slice(0, FOR_YOU_LIMIT)
}

export function splitOnboardingRouteSuggestions(
  routes: RouteSummary[],
  interestTagIds: string[],
  geographyScope: TouristGeographyScope = 'plock_city',
): OnboardingRouteSuggestions {
  const catalog = touristRouteCatalog(routes, geographyScope)
  const tags = interestTagIds.filter((id) => id !== CUSTOM_INTEREST_ID)
  const forYou = buildForYouRoutes(catalog, tags)
  const forYouIds = new Set(forYou.map((route) => route.id))

  const other = [...catalog]
    .filter((route) => !forYouIds.has(route.id))
    .sort(compareRoutes)
    .slice(0, OTHER_ROUTES_LIMIT)

  return { forYou, other }
}

export function routeMatchesInterestTags(
  route: RouteSummary,
  interestTagIds: string[],
): boolean {
  const tags = interestTagIds.filter((id) => id !== CUSTOM_INTEREST_ID)
  if (tags.length === 0) {
    return true
  }
  return route.category !== null && tags.includes(route.category)
}
