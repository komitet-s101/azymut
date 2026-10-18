import type { RouteSummary } from '@/lib/routeApi'
import type { TouristGeographyScope } from '@/types/userContext'

export type { TouristGeographyScope }

export const TOURIST_ROUTE_PREFIXES = ['DAY-R', 'PLK-R', 'REG-R'] as const

function routeExternalId(route: RouteSummary): string {
  return route.external_id?.trim() ?? ''
}

export function isPredefinedTouristRoute(route: RouteSummary): boolean {
  const id = routeExternalId(route)
  return TOURIST_ROUTE_PREFIXES.some((prefix) => id.startsWith(prefix))
}

function fold(value: string): string {
  return value.trim().toLocaleLowerCase('pl-PL')
}

function mentionsNonPlockLocality(text: string): boolean {
  const folded = fold(text)
  if (!folded) {
    return false
  }
  const outsideMarkers = [
    'sierpc',
    'gostynin',
    'gąbin',
    'łąck',
    'cierszew',
    'brudzeń',
    'słupno',
    'bodzanów',
    'miałków',
    'koszelów',
    'wiączemin',
    'troszyn',
    'brwilno',
    'sokołów',
    'dobrzyków',
    'murzynów',
    'sikórz',
    'strzemeszno',
    'proboszczewice',
    'szeligi',
    'parzeń',
  ]
  return outsideMarkers.some((marker) => folded.includes(marker))
}

/** Trasa mieści się w zakresie „tylko Płock” (bez wycieczek regionalnych). */
export function routeMatchesPlockCityScope(route: RouteSummary): boolean {
  const id = routeExternalId(route)
  if (id.startsWith('REG-R')) {
    return false
  }
  if (id.startsWith('PLK-R')) {
    return true
  }
  if (id.startsWith('DAY-R')) {
    const city = fold(route.city)
    if (city.includes('/') || city.includes(';')) {
      return false
    }
    if (mentionsNonPlockLocality(route.city) || mentionsNonPlockLocality(route.gmina)) {
      return false
    }
    return city.includes('płock') || city === ''
  }
  return fold(route.city) === 'płock' && !mentionsNonPlockLocality(route.gmina)
}

export function filterRoutesByGeographyScope(
  routes: RouteSummary[],
  scope: TouristGeographyScope,
): RouteSummary[] {
  if (scope === 'plock_region') {
    return routes
  }
  return routes.filter(routeMatchesPlockCityScope)
}

export function touristRouteCatalog(
  routes: RouteSummary[],
  scope: TouristGeographyScope,
): RouteSummary[] {
  const predefined = routes.filter(isPredefinedTouristRoute)
  const scoped = filterRoutesByGeographyScope(predefined, scope)
  return scoped.length > 0 ? scoped : filterRoutesByGeographyScope(routes, scope)
}

export function touristRouteKindLabel(route: RouteSummary): string | null {
  const id = routeExternalId(route)
  if (id.startsWith('DAY-R')) {
    return null
  }
  if (id.startsWith('PLK-R')) {
    return route.route_type === 'official' ? 'Spacer PLOT' : 'Trasa w Płocku'
  }
  if (id.startsWith('REG-R')) {
    return 'Region płocki'
  }
  return null
}
