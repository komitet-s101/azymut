import { Clock, MapPin, Signpost } from 'lucide-react'

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
    <figure className="rounded-xl border border-primary/20 bg-white px-3 py-2.5 shadow-sm ring-1 ring-primary/5">
      <figcaption className="text-[0.6875rem] font-semibold uppercase tracking-wide text-primary/80">
        Wybrana trasa
      </figcaption>
      <blockquote className="mt-1 font-heading text-base font-semibold leading-snug text-foreground">
        {trimmed}
      </blockquote>
      {duration || locationLine || stops ? (
        <div className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground">
          {duration ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 shrink-0 text-primary" aria-hidden />
              {duration}
            </span>
          ) : null}
          {locationLine ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
              {locationLine}
            </span>
          ) : null}
          {stops ? (
            <span className="inline-flex items-center gap-1.5">
              <Signpost className="size-4 shrink-0 text-primary" aria-hidden />
              {stops}
            </span>
          ) : null}
        </div>
      ) : null}
    </figure>
  )
}
