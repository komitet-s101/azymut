from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class WeatherCondition(StrEnum):
    CLEAR = "clear"
    CLOUDY = "cloudy"
    RAIN = "rain"
    SNOW = "snow"
    STORM = "storm"
    UNKNOWN = "unknown"


class AirQuality(BaseModel):
    pm25_ug_m3: float | None = None
    pm10_ug_m3: float | None = None
    air_index_level: str | None = None
    source_locker_code: str | None = None
    humidity_pct: float | None = None


class WeatherSnapshot(BaseModel):
    lat: float
    lon: float
    observed_at: datetime
    condition: WeatherCondition
    temperature_c: float
    precipitation_mm_h: float
    wind_speed_ms: float
    is_outdoor_friendly: bool
    air_quality: AirQuality | None = None
    provider: str = "stub"
    station_name: str | None = None


class ForecastHour(BaseModel):
    start: datetime
    end: datetime
    condition: WeatherCondition
    precipitation_mm_h: float
    is_outdoor_friendly: bool


class WeatherForecast(BaseModel):
    lat: float
    lon: float
    hours: list[ForecastHour] = Field(default_factory=list)
    provider: str = "stub"


class WeatherProviderError(Exception):
    def __init__(self, message: str, provider: str) -> None:
        super().__init__(message)
        self.provider = provider
