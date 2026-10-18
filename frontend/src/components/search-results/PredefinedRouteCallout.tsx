import { Clock, MapPin, Signpost } from 'lucide-react'

import { appLayout } from '@/lib/appLayout'
import { cn } from '@/lib/utils'

type PredefinedRouteCalloutProps = {
  routeName: string
  durationMinutesApprox?: number | null
  city?: string | null
  gmina?: string | null
  stopsMin?: number
  stopsMax?: number
}

function formatDayDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60
    return rest > 0 ? `ok. ${hours} h ${rest} min` : `ok. ${hours} h`
  }
  return `ok. ${minutes} min`
}

function stopsLabel(stopsMin?: number, stopsMax?: number): string | null {
  if (stopsMin === undefined || stopsMax === undefined) {
    return null
  }
  if (stopsMin === stopsMax) {
    return `${stopsMin} przystanków`
  }
  return `${stopsMin}–${stopsMax} przystanków`
}

export function PredefinedRouteCallout({
  routeName,
  durationMinutesApprox,
  city,
  gmina,
  stopsMin,
  stopsMax,
}: PredefinedRouteCalloutProps) {
  const trimmed = routeName.trim()
  if (!trimmed) {
    return null
  }

  const locationLine = [city, gmina].filter(Boolean).join(' · ')
  const stops = stopsLabel(stopsMin, stopsMax)
  const duration =
    durationMinutesApprox !== null &&
    durationMinutesApprox !== undefined &&
    durationMinutesApprox > 0
      ? formatDayDuration(durationMinutesApprox)
      : null

  return (
    <figure className={appLayout.callout}>
      <figcaption className={appLayout.calloutLabel}>Wybrana trasa</figcaption>
      <blockquote className={appLayout.calloutBody}>{trimmed}</blockquote>
      {duration || locationLine || stops ? (
        <div className={cn(appLayout.metaStack, 'mt-2')}>
          {duration ? (
            <span className={appLayout.metaRow}>
              <Clock className={appLayout.metaIcon} aria-hidden />
              {duration}
            </span>
          ) : null}
          {locationLine ? (
            <span className={appLayout.metaRow}>
              <MapPin className={appLayout.metaIcon} aria-hidden />
              {locationLine}
            </span>
          ) : null}
          {stops ? (
            <span className={appLayout.metaRow}>
              <Signpost className={appLayout.metaIcon} aria-hidden />
              {stops}
            </span>
          ) : null}
        </div>
      ) : null}
    </figure>
  )
}
