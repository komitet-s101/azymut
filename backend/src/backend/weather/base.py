from __future__ import annotations

from typing import Protocol

from backend.api.schemas.weather import WeatherForecast, WeatherSnapshot


class WeatherProvider(Protocol):
    provider_name: str

    async def get_current(self, lat: float, lon: float) -> WeatherSnapshot: ...

    async def get_forecast(
        self, lat: float, lon: float, hours: int = 24
    ) -> WeatherForecast: ...
