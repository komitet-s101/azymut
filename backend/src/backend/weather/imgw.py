from __future__ import annotations

from datetime import UTC, datetime
from zoneinfo import ZoneInfo

import httpx

from backend.api.geo import haversine_km
from backend.api.schemas.weather import (
    WeatherCondition,
    WeatherProviderError,
    WeatherSnapshot,
)
from backend.weather.imgw_synop_stations import station_coords
from backend.weather.rules import compute_is_outdoor_friendly, imgw_precip_to_condition

SYNOP_URL = "https://danepubliczne.imgw.pl/api/data/synop/format/json"
WARNINGS_URL = "https://danepubliczne.imgw.pl/api/data/warningsmeteo"


class ImgwSynopClient:
    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client
        self._owns_client = client is None
        self._warning_active: bool | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def close(self) -> None:
        if self._owns_client and self._client is not None:
            await self._client.aclose()
            self._client = None

    async def _fetch_synop(self) -> list[dict]:
        client = await self._get_client()
        response = await client.get(SYNOP_URL)
        response.raise_for_status()
        data = response.json()
        if not isinstance(data, list):
            raise WeatherProviderError("Unexpected IMGW synop payload", "imgw")
        return data

    async def _has_active_meteo_warning(self) -> bool:
        if self._warning_active is not None:
            return self._warning_active
        client = await self._get_client()
        try:
            response = await client.get(WARNINGS_URL)
            response.raise_for_status()
            payload = response.json()
        except httpx.HTTPError:
            self._warning_active = False
            return False
        if isinstance(payload, list) and len(payload) > 0:
            self._warning_active = True
            return True
        self._warning_active = False
        return False

    def _pick_nearest(self, lat: float, lon: float, rows: list[dict]) -> dict | None:
        best: dict | None = None
        best_dist = float("inf")
        for row in rows:
            name = row.get("stacja") or ""
            coords = station_coords(name)
            if coords is None:
                continue
            dist = haversine_km(lat, lon, coords[0], coords[1])
            if dist < best_dist:
                best_dist = dist
                best = row
        return best

    def _parse_observed_at(self, row: dict) -> datetime:
        tz = ZoneInfo("Europe/Warsaw")
        date_s = row.get("data_pomiaru", "")
        hour_s = row.get("godzina_pomiaru", "0")
        try:
            return datetime.strptime(
                f"{date_s} {hour_s.zfill(2)}:00",
                "%Y-%m-%d %H:%M",
            ).replace(tzinfo=tz)
        except ValueError:
            return datetime.now(UTC)

    async def get_current_snapshot(self, lat: float, lon: float) -> WeatherSnapshot:
        try:
            rows = await self._fetch_synop()
        except httpx.HTTPError as exc:
            raise WeatherProviderError(f"IMGW synop request failed: {exc}", "imgw") from exc

        row = self._pick_nearest(lat, lon, rows)
        if row is None:
            raise WeatherProviderError("No IMGW station with known coordinates", "imgw")

        try:
            temp = float(row.get("temperatura") or 0)
        except (TypeError, ValueError):
            temp = 0.0
        try:
            wind_kmh = float(row.get("predkosc_wiatru") or 0)
        except (TypeError, ValueError):
            wind_kmh = 0.0
        wind_ms = wind_kmh / 3.6
        suma_opadu = row.get("suma_opadu")
        condition = imgw_precip_to_condition(
            str(suma_opadu) if suma_opadu is not None else None
        )
        precip_mm_h = 0.0
        if suma_opadu not in (None, ""):
            try:
                precip_mm_h = float(suma_opadu)
            except ValueError:
                precip_mm_h = 0.0

        warning = await self._has_active_meteo_warning()
        if warning and condition == WeatherCondition.CLEAR:
            condition = WeatherCondition.STORM

        outdoor = compute_is_outdoor_friendly(
            condition=condition,
            precipitation_mm_h=precip_mm_h,
            meteo_warning_active=warning,
        )

        return WeatherSnapshot(
            lat=lat,
            lon=lon,
            observed_at=self._parse_observed_at(row),
            condition=condition,
            temperature_c=temp,
            precipitation_mm_h=precip_mm_h,
            wind_speed_ms=wind_ms,
            is_outdoor_friendly=outdoor,
            provider="imgw",
            station_name=row.get("stacja"),
        )
