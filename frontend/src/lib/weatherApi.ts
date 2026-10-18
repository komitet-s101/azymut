function apiBase(): string {
  const configured = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  return configured.replace(/\/$/, '')
}

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
