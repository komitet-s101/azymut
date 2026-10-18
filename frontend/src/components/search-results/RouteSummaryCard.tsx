import { Clock, MapPin, Signpost } from 'lucide-react'

import { PlanCategoryBadge } from '@/components/search-results/PlanCategoryBadge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import type { RouteSummary } from '@/lib/routeApi'
import { appLayout } from '@/lib/appLayout'
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

  return (
    <Card
      className={cn(
        appLayout.cardShell,
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
      <CardHeader className={appLayout.cardHeader}>
        <CardTitle className={appLayout.cardTitle}>{route.name}</CardTitle>
        {blurb ? <p className={appLayout.bodyMuted}>{blurb}</p> : null}
        <div className={cn(appLayout.resultMetaPanel, blurb ? 'mt-1' : 'mt-0.5')}>
          {route.category ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <PlanCategoryBadge category={route.category} />
            </div>
          ) : null}
          <div className={cn(appLayout.metaStack, 'text-foreground/85')}>
            <span className={appLayout.metaRow}>
              <Clock className={appLayout.metaIcon} aria-hidden />
              {formatDayDuration(route.duration_minutes_approx)}
            </span>
            {locationLine ? (
              <span className={appLayout.metaRow}>
                <MapPin className={appLayout.metaIcon} aria-hidden />
                {locationLine}
              </span>
            ) : null}
            <span className={appLayout.metaRow}>
              <Signpost className={appLayout.metaIcon} aria-hidden />
              {stopsLabel(route)}
            </span>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
