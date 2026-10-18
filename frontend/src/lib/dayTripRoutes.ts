import type { RouteSummary } from '@/lib/routeApi'

/** Identyfikatory tras jednodniowych z `trasy_jednodniowe.md` / `predefined_routes.csv`. */
export const DAY_TRIP_ROUTE_PREFIX = 'DAY-R'

export function isDayTripRoute(route: RouteSummary): boolean {
  const id = route.external_id?.trim() ?? ''
  return id.startsWith(DAY_TRIP_ROUTE_PREFIX)
}
