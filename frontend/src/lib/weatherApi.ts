import { apiBase } from '@/lib/apiBase'

export type WeatherCondition =
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'storm'
  | 'unknown'

export type WeatherSnapshot = {
  lat: number
  lon: number
  observed_at: string
  condition: WeatherCondition
  temperature_c: number
  precipitation_mm_h: number
  wind_speed_ms: number
  is_outdoor_friendly: boolean
  provider: string
  station_name: string | null
}

export async function fetchCurrentWeather(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  })
  const response = await fetch(`${apiBase()}/api/v1/weather/current?${params}`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) {
    throw new Error('Nie udało się pobrać pogody.')
  }
  return (await response.json()) as WeatherSnapshot
}
