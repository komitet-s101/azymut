from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any

from backend.api.schemas.weather import WeatherForecast, WeatherSnapshot
from backend.settings import Settings, get_settings
from backend.weather.composite import ImgwInPostCompositeProvider
from backend.weather.imgw import ImgwSynopClient
from backend.weather.inpost_air import InPostAirClient
from backend.weather.open_meteo import OpenMeteoProvider
from backend.weather.stub import StubWeatherProvider


@dataclass
class _CacheEntry:
    expires_at: float
    value: Any


_cache: dict[tuple[str, ...], _CacheEntry] = {}


def _cache_get(key: tuple[str, ...]) -> Any | None:
    entry = _cache.get(key)
    if entry is None:
        return None
    if time.monotonic() > entry.expires_at:
        _cache.pop(key, None)
        return None
    return entry.value


def _cache_set(key: tuple[str, ...], value: Any, ttl_seconds: int) -> None:
    _cache[key] = _CacheEntry(
        expires_at=time.monotonic() + ttl_seconds,
        value=value,
    )


def build_weather_provider(settings: Settings):
    if settings.weather_provider == "stub":
        return StubWeatherProvider()
    if settings.weather_provider == "open_meteo":
        return OpenMeteoProvider()
    if settings.weather_provider == "imgw_inpost":
        inpost: InPostAirClient | None = None
        if settings.inpost_enabled and settings.inpost_locker_code:
            inpost = InPostAirClient(
                locker_code=settings.inpost_locker_code,
                locker_id=settings.inpost_locker_id or None,
                enabled=True,
            )
        return ImgwInPostCompositeProvider(
            imgw=ImgwSynopClient(),
            open_meteo=OpenMeteoProvider(),
            inpost=inpost,
        )
    return StubWeatherProvider()


class WeatherService:
    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()
        self._provider = build_weather_provider(self._settings)

    @property
    def provider_name(self) -> str:
        return getattr(self._provider, "provider_name", self._settings.weather_provider)

    async def get_current(self, lat: float, lon: float) -> WeatherSnapshot:
        ttl = self._settings.weather_cache_ttl_seconds
        key = ("current", self.provider_name, f"{lat:.4f}", f"{lon:.4f}")
        cached = _cache_get(key)
        if cached is not None:
            return cached
        snapshot = await self._provider.get_current(lat, lon)
        _cache_set(key, snapshot, ttl)
        return snapshot

    async def get_forecast(
        self, lat: float, lon: float, hours: int = 24
    ) -> WeatherForecast:
        ttl = self._settings.weather_cache_ttl_seconds
        capped = min(max(hours, 1), 72)
        key = ("forecast", self.provider_name, f"{lat:.4f}", f"{lon:.4f}", str(capped))
        cached = _cache_get(key)
        if cached is not None:
            return cached
        forecast = await self._provider.get_forecast(lat, lon, capped)
        _cache_set(key, forecast, ttl)
        return forecast


_weather_service: WeatherService | None = None


def get_weather_service() -> WeatherService:
    global _weather_service
    if _weather_service is None:
        _weather_service = WeatherService()
    return _weather_service


def reset_weather_service() -> None:
    global _weather_service
    _weather_service = None
    _cache.clear()
