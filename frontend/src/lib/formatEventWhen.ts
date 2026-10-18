const WEEKDAY_DATE = new Intl.DateTimeFormat('pl-PL', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
})

export function formatEventWhen(startDate: string, startTime: string | null): string {
  const datePart = startDate.trim()
  if (!datePart) {
    return startTime?.trim() ?? 'Termin do potwierdzenia'
  }
  const parsed = new Date(`${datePart}T12:00:00`)
  const dateLabel = Number.isNaN(parsed.getTime())
    ? datePart
    : WEEKDAY_DATE.format(parsed)
  const time = startTime?.trim()
  if (!time) {
    return dateLabel
  }
  return `${dateLabel} · ${time}`
}

export function formatEventLocation(
  city: string | null,
  addressLine: string | null,
): string {
  const parts = [city, addressLine].filter((part) => part?.trim())
  if (parts.length === 0) {
    return 'Płock i okolice'
  }
  return parts.join(' · ')
}
