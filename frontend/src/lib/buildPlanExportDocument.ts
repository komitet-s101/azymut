import type { PlanExportDocument, PlanExportStop } from '@/lib/planExport'
import { categoryLabel, priceLabel, type SearchResult } from '@/lib/searchApi'
import type { TrailStop } from '@/lib/trail'
import { trailVisitMinutes } from '@/lib/trail'
import type { WalkingRoute } from '@/lib/walkingRoute'

type BuildPlanExportInput = {
  title: string
  subtitle: string
  contextLabel: string
  ticketNote: string
  weatherNote: string
  trailStops: TrailStop[]
  fallbackResults: SearchResult[]
  walkingRoute: WalkingRoute | null
}

function stopFromTrail(stop: TrailStop): PlanExportStop {
  const item = stop.result
  const when = [item.start_date, item.start_time].filter(Boolean).join(' · ') || null
  const location = [item.city, item.address_line].filter(Boolean).join(' · ') || null
  return {
    order: stop.order,
    name: item.name,
    category: item.kind === 'event' ? 'Wydarzenie' : categoryLabel(item.category),
    when,
    location,
    price: priceLabel(item.price_level, item.flags),
    visitMinutes: item.typical_visit_minutes,
  }
}

function stopFromResult(item: SearchResult, order: number | null): PlanExportStop {
  const when = [item.start_date, item.start_time].filter(Boolean).join(' · ') || null
  const location = [item.city, item.address_line].filter(Boolean).join(' · ') || null
  return {
    order,
    name: item.name,
    category: item.kind === 'event' ? 'Wydarzenie' : categoryLabel(item.category),
    when,
    location,
    price: priceLabel(item.price_level, item.flags),
    visitMinutes: item.typical_visit_minutes,
  }
}

export function buildPlanExportDocument(input: BuildPlanExportInput): PlanExportDocument | null {
  const stops: PlanExportStop[] =
    input.trailStops.length > 0
      ? input.trailStops.map(stopFromTrail)
      : input.fallbackResults.map((item) => stopFromResult(item, null))

  if (stops.length === 0) {
    return null
  }

  const visitMinutesTotal =
    input.trailStops.length > 0 ? trailVisitMinutes(input.trailStops) : null

  const routeNote =
    input.walkingRoute && !input.walkingRoute.followsRoads
      ? 'Na mapie w aplikacji trasa może być uproszczona (linia prosta między punktami).'
      : null

  return {
    title: input.title,
    subtitle: input.subtitle,
    contextLabel: input.contextLabel,
    ticketNote: input.ticketNote,
    weatherNote: input.weatherNote,
    stops,
    routeDistanceKm: input.walkingRoute?.distanceKm ?? null,
    routeWalkMinutes: input.walkingRoute?.durationMinutes ?? null,
    visitMinutesTotal,
    routeNote,
    generatedAt: new Date(),
  }
}
