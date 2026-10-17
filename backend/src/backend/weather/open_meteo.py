from __future__ import annotations

from datetime import UTC, datetime, timedelta

import httpx

from backend.api.schemas.weather import (
    ForecastHour,
    WeatherForecast,
    WeatherProviderError,
    WeatherSnapshot,
)
from backend.weather.rules import compute_is_outdoor_friendly, wmo_code_to_condition

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


class OpenMeteoProvider:
    provider_name = "open_meteo"

    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client
        self._owns_client = client is None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def close(self) -> None:
        if self._owns_client and self._client is not None:
            await self._client.aclose()
            self._client = None

    async def _fetch(self, lat: float, lon: float, hours: int) -> dict:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,precipitation,wind_speed_10m,weather_code",
            "hourly": "precipitation,weather_code,wind_speed_10m",
            "forecast_hours": min(hours, 72),
            "timezone": "Europe/Warsaw",
        }
        client = await self._get_client()
        try:
            response = await client.get(OPEN_METEO_URL, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as exc:
            raise WeatherProviderError(
                f"Open-Meteo request failed: {exc}", self.provider_name
            ) from exc

    async def get_current(self, lat: float, lon: float) -> WeatherSnapshot:
        payload = await self._fetch(lat, lon, 1)
        current = payload.get("current") or {}
        code = int(current.get("weather_code") or 0)
        condition = wmo_code_to_condition(code)
        precip = float(current.get("precipitation") or 0)
        wind_kmh = float(current.get("wind_speed_10m") or 0)
        temp = float(current.get("temperature_2m") or 0)
        time_s = current.get("time")
        if time_s:
            observed = datetime.fromisoformat(time_s).replace(tzinfo=UTC)
        else:
            observed = datetime.now(UTC)

        return WeatherSnapshot(
            lat=lat,
            lon=lon,
            observed_at=observed,
            condition=condition,
            temperature_c=temp,
            precipitation_mm_h=precip,
            wind_speed_ms=wind_kmh / 3.6,
            is_outdoor_friendly=compute_is_outdoor_friendly(
                condition=condition,
                precipitation_mm_h=precip,
            ),
            provider=self.provider_name,
        )

    async def get_forecast(
        self, lat: float, lon: float, hours: int = 24
    ) -> WeatherForecast:
        capped = min(max(hours, 1), 72)
        payload = await self._fetch(lat, lon, capped)
        hourly = payload.get("hourly") or {}
        times: list[str] = hourly.get("time") or []
        precips: list[float] = [float(x or 0) for x in (hourly.get("precipitation") or [])]
        codes: list[int] = [int(x or 0) for x in (hourly.get("weather_code") or [])]

        slots: list[ForecastHour] = []
        for i, time_s in enumerate(times[:capped]):
            start = datetime.fromisoformat(time_s)
            if start.tzinfo is None:
                start = start.replace(tzinfo=UTC)
            end = start + timedelta(hours=1)
            code = codes[i] if i < len(codes) else 0
            precip = precips[i] if i < len(precips) else 0.0
            condition = wmo_code_to_condition(code)
            slots.append(
                ForecastHour(
                    start=start,
                    end=end,
                    condition=condition,
                    precipitation_mm_h=precip,
                    is_outdoor_friendly=compute_is_outdoor_friendly(
                        condition=condition,
                        precipitation_mm_h=precip,
                    ),
                )
            )

        return WeatherForecast(
            lat=lat,
            lon=lon,
            hours=slots,
            provider=self.provider_name,
        )
