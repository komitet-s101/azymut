from __future__ import annotations

from datetime import UTC, datetime, timedelta

from backend.api.schemas.weather import (
    ForecastHour,
    WeatherCondition,
    WeatherForecast,
    WeatherSnapshot,
)
from backend.weather.rules import compute_is_outdoor_friendly


class StubWeatherProvider:
    provider_name = "stub"

    async def get_current(self, lat: float, lon: float) -> WeatherSnapshot:
        now = datetime.now(UTC)
        condition = WeatherCondition.CLEAR
        return WeatherSnapshot(
            lat=lat,
            lon=lon,
            observed_at=now,
            condition=condition,
            temperature_c=18.0,
            precipitation_mm_h=0.0,
            wind_speed_ms=2.5,
            is_outdoor_friendly=compute_is_outdoor_friendly(
                condition=condition,
                precipitation_mm_h=0.0,
            ),
            provider=self.provider_name,
        )

    async def get_forecast(
        self, lat: float, lon: float, hours: int = 24
    ) -> WeatherForecast:
        now = datetime.now(UTC).replace(minute=0, second=0, microsecond=0)
        slots: list[ForecastHour] = []
        for i in range(hours):
            start = now + timedelta(hours=i)
            end = start + timedelta(hours=1)
            condition = WeatherCondition.CLEAR
            slots.append(
                ForecastHour(
                    start=start,
                    end=end,
                    condition=condition,
                    precipitation_mm_h=0.0,
                    is_outdoor_friendly=compute_is_outdoor_friendly(
                        condition=condition,
                        precipitation_mm_h=0.0,
                    ),
                )
            )
        return WeatherForecast(lat=lat, lon=lon, hours=slots, provider=self.provider_name)
