import { Clock, MapPin, Signpost } from 'lucide-react'

import { PlanCategoryBadge } from '@/components/search-results/PlanCategoryBadge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import type { RouteSummary } from '@/lib/routeApi'
import { touristRouteKindLabel } from '@/lib/touristRoutes'
import { cn } from '@/lib/utils'

type RouteSummaryCardProps = {
  route: RouteSummary
  selected?: boolean
  onSelect?: () => void
}

function stopsLabel(route: RouteSummary): string {
  if (route.stops_min === route.stops_max) {
    return `${route.stops_min} przystanków`
  }
  return `${route.stops_min}–${route.stops_max} przystanków`
}

function shortDescription(description: string | null): string | null {
  if (!description?.trim()) {
    return null
  }
  const line = description.trim().split('\n')[0]?.trim() ?? ''
  if (line.length <= 120) {
    return line
  }
  return `${line.slice(0, 117)}…`
}

function formatDayDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60
    return rest > 0 ? `ok. ${hours} h ${rest} min` : `ok. ${hours} h`
  }
  return `ok. ${minutes} min`
}

export function RouteSummaryCard({ route, selected = false, onSelect }: RouteSummaryCardProps) {
  const blurb = shortDescription(route.description)
  const interactive = Boolean(onSelect)
  const locationLine = [route.city, route.gmina].filter(Boolean).join(' · ')
  const routeKind = touristRouteKindLabel(route)

  return (
    <Card
      className={cn(
        'gap-0 overflow-hidden border-border/80 py-0',
        selected && 'ring-2 ring-primary',
        interactive && 'cursor-pointer',
      )}
      onClick={onSelect}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect?.()
              }
            }
          : undefined
      }
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? selected : undefined}
    >
      <CardHeader className="gap-2 px-4 py-4">
        <CardTitle className="text-base leading-snug">{route.name}</CardTitle>
        {blurb ? (
          <p className="text-sm leading-snug text-muted-foreground">{blurb}</p>
        ) : null}
        <div
          className={cn(
            'flex flex-col gap-2.5 rounded-xl border border-border/80 bg-muted/35 px-3 py-3',
            blurb ? 'mt-1' : 'mt-0.5',
          )}
        >
          {routeKind || route.category ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {routeKind ? (
                <span className="inline-flex w-fit rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {routeKind}
                </span>
              ) : null}
              {route.category ? <PlanCategoryBadge category={route.category} /> : null}
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5 text-sm text-foreground/85">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 shrink-0 text-primary" aria-hidden />
              {formatDayDuration(route.duration_minutes_approx)}
            </span>
            {locationLine ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
                {locationLine}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Signpost className="size-4 shrink-0 text-primary" aria-hidden />
              {stopsLabel(route)}
            </span>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
