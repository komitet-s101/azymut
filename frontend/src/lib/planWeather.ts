import type { TrailStop } from '@/lib/trail'
import type { WeatherSnapshot } from '@/lib/weatherApi'

/** Domyślne współrzędne Płocka — zgodne z backendem (`search._PLOCK_*`). */
export const PLOCK_WEATHER_CENTER = { lat: 52.5468, lon: 19.7064 }

const CONDITION_LABELS: Record<WeatherSnapshot['condition'], string> = {
  clear: 'bezchmurnie',
  cloudy: 'pochmurno',
  rain: 'deszcz',
  snow: 'śnieg',
  storm: 'burza',
  unknown: 'warunki nieznane',
}

const plNumber = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 })

export function planWeatherCoords(stops: TrailStop[]): { lat: number; lon: number } {
  if (stops.length === 0) {
    return PLOCK_WEATHER_CENTER
  }
  let lat = 0
  let lon = 0
  for (const stop of stops) {
    lat += stop.lat
    lon += stop.lon
  }
  return { lat: lat / stops.length, lon: lon / stops.length }
}

export function formatCurrentWeatherLine(snapshot: WeatherSnapshot): string {
  const temp = Math.round(snapshot.temperature_c)
  const condition = CONDITION_LABELS[snapshot.condition]
  const parts = [`Teraz ok. ${temp}°C, ${condition}`]
  if (snapshot.precipitation_mm_h > 0.05) {
    parts.push(`opady ${plNumber.format(snapshot.precipitation_mm_h)} mm/h`)
  }
  parts.push(`wiatr ${plNumber.format(snapshot.wind_speed_ms)} m/s`)
  if (snapshot.station_name) {
    parts.push(`(${snapshot.station_name})`)
  }
  return parts.join(' · ')
}

export function outdoorWeatherHint(snapshot: WeatherSnapshot): string | null {
  if (!snapshot.is_outdoor_friendly) {
    return 'Pogoda nie sprzyja długiemu pobytowi na zewnątrz — rozważ miejsca pod dachem.'
  }
  return null
}

export function formatPlanWeatherText(
  snapshot: WeatherSnapshot,
  contextNote: string | null | undefined,
): string {
  const lines = [formatCurrentWeatherLine(snapshot)]
  const hint = contextNote?.trim() || outdoorWeatherHint(snapshot)
  if (hint) {
    lines.push(hint)
  }
  return lines.join(' ')
}
