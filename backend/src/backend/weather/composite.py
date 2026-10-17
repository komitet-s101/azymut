from __future__ import annotations

from backend.api.schemas.weather import WeatherForecast, WeatherSnapshot
from backend.weather.imgw import ImgwSynopClient
from backend.weather.inpost_air import InPostAirClient
from backend.weather.open_meteo import OpenMeteoProvider
from backend.weather.rules import PM25_OUTDOOR_THRESHOLD_UG_M3


class ImgwInPostCompositeProvider:
    provider_name = "imgw_inpost"

    def __init__(
        self,
        imgw: ImgwSynopClient,
        open_meteo: OpenMeteoProvider,
        inpost: InPostAirClient | None = None,
    ) -> None:
        self._imgw = imgw
        self._open_meteo = open_meteo
        self._inpost = inpost

    async def get_current(self, lat: float, lon: float) -> WeatherSnapshot:
        snapshot = await self._imgw.get_current_snapshot(lat, lon)
        snapshot.provider = self.provider_name

        if self._inpost is None:
            return snapshot

        reading = await self._inpost.fetch_reading()
        if reading is None:
            return snapshot

        snapshot.air_quality = reading.air_quality
        if reading.temperature_c is not None:
            snapshot.temperature_c = reading.temperature_c

        pm25 = reading.air_quality.pm25_ug_m3 if reading.air_quality else None
        if pm25 is not None and pm25 > PM25_OUTDOOR_THRESHOLD_UG_M3:
            snapshot.is_outdoor_friendly = False
        return snapshot

    async def get_forecast(
        self, lat: float, lon: float, hours: int = 24
    ) -> WeatherForecast:
        forecast = await self._open_meteo.get_forecast(lat, lon, hours)
        forecast.provider = self.provider_name
        return forecast
