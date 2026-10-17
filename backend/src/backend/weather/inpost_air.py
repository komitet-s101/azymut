from __future__ import annotations

import logging
import re
import unicodedata
from dataclasses import dataclass
from urllib.parse import urlsplit

import httpx

from backend.api.schemas.weather import AirQuality

_LOGGER = logging.getLogger(__name__)

POINTS_URL = "https://inpost.pl/sites/default/files/points.json"
EASYPACK_URL = "https://api-shipx-pl.easypack24.net/v1/points/"


@dataclass
class InPostAirReading:
    air_quality: AirQuality
    temperature_c: float | None = None


class InPostAirClientError(Exception):
    pass


class InPostSensorsMissingError(InPostAirClientError):
    pass


def _slugify_segment(text: str) -> str:
    lowered = text.lower().strip()
    nfkd = unicodedata.normalize("NFKD", lowered)
    ascii_text = "".join(c for c in nfkd if not unicodedata.combining(c))
    ascii_text = re.sub(r"[^a-z0-9]+", "-", ascii_text)
    return re.sub(r"-+", "-", ascii_text).strip("-")


def _parcel_locker_url(city_slug: str, code: str, street: str, region: str) -> str:
    pathname = _slugify_segment(
        f"paczkomat-{city_slug}-{code}-{street}-paczkomaty-{region}"
    )
    return f"https://inpost.pl/{pathname}"


def _parse_sensor_line(line: str) -> dict[str, float] | None:
    if match := re.match(r"PM25:(\d+(?:\.\d+)?):", line):
        return {"pm25": float(match.group(1))}
    if match := re.match(r"PM10:(\d+(?:\.\d+)?):", line):
        return {"pm10": float(match.group(1))}
    if match := re.match(r"TEMPERATURE:(-?\d+(?:\.\d+)?):", line):
        return {"temperature": float(match.group(1))}
    if match := re.match(r"HUMIDITY:(\d+(?:\.\d+)?):", line):
        return {"humidity": float(match.group(1))}
    return None


class InPostAirClient:
    def __init__(
        self,
        locker_code: str,
        locker_id: str | None = None,
        enabled: bool = True,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.locker_code = locker_code
        self.locker_id = locker_id
        self.enabled = enabled
        self._client = client
        self._owns_client = client is None
        self._page_url: str | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=30.0,
                follow_redirects=True,
                headers={"User-Agent": "Mozilla/5.0 (compatible; LeisurePlanner/1.0)"},
            )
        return self._client

    async def close(self) -> None:
        if self._owns_client and self._client is not None:
            await self._client.aclose()
            self._client = None

    async def _find_point(self) -> dict | None:
        client = await self._get_client()
        response = await client.get(POINTS_URL)
        response.raise_for_status()
        items = (response.json()).get("items") or []
        for item in items:
            if item.get("n") == self.locker_code:
                return item
        response = await client.get(EASYPACK_URL + self.locker_code)
        if response.status_code >= 400:
            return None
        resp = response.json()
        if resp.get("error"):
            return None
        addr = resp.get("address_details") or {}
        loc = resp.get("location") or {"latitude": "0", "longitude": "0"}
        city = addr.get("city") or ""
        return {
            "n": resp["name"],
            "g": city.lower(),
            "e": addr.get("street") or "",
            "r": addr.get("province") or "",
            "c": city,
        }

    async def _resolve_locker_id(self, point: dict) -> str:
        if self.locker_id:
            return self.locker_id
        page_url = _parcel_locker_url(
            point.get("g") or "",
            point.get("n") or self.locker_code,
            point.get("e") or "",
            point.get("r") or "",
        )
        client = await self._get_client()
        response = await client.get(page_url)
        response.raise_for_status()
        self._page_url = str(response.url)
        match = re.search(
            r'data-shipx-url="(?:/en)?/shipx-point-data/(.*?)/(.*?)/air_index_level"',
            response.text,
        )
        if match is None:
            raise InPostAirClientError("Could not find shipx locker id on InPost page")
        self.locker_id = match.group(1)
        return self.locker_id

    async def fetch_reading(self) -> InPostAirReading | None:
        if not self.enabled or not self.locker_code:
            return None
        try:
            point = await self._find_point()
            if point is None:
                _LOGGER.warning("InPost locker %s not found", self.locker_code)
                return None
            locker_id = await self._resolve_locker_id(point)
            page_url = self._page_url or _parcel_locker_url(
                point.get("g") or "",
                point.get("n") or self.locker_code,
                point.get("e") or "",
                point.get("r") or "",
            )
            client = await self._get_client()
            post_url = (
                f"https://inpost.pl/shipx-point-data/{locker_id}/"
                f"{self.locker_code}/air_index_level"
            )
            response = await client.post(
                post_url,
                headers={
                    "X-Requested-With": "XMLHttpRequest",
                    "Origin": "https://inpost.pl",
                    "Referer": page_url,
                },
            )
            if response.status_code == 404:
                raise InPostSensorsMissingError("Air sensors not available")
            if response.status_code == 403:
                raise InPostAirClientError("InPost blocked the request")
            response.raise_for_status()
            payload = response.json()
        except InPostSensorsMissingError:
            _LOGGER.warning("InPost locker %s has no air sensors", self.locker_code)
            return None
        except (httpx.HTTPError, InPostAirClientError) as exc:
            _LOGGER.warning("InPost air fetch failed: %s", exc)
            return None

        if urlsplit(str(response.url)).path.rstrip("/") == "/znajdz-paczkomat":
            return None

        sensors: dict[str, float] = {}
        for line in payload.get("air_sensors") or []:
            parsed = _parse_sensor_line(line)
            if parsed:
                sensors.update(parsed)

        air_quality = AirQuality(
            pm25_ug_m3=sensors.get("pm25"),
            pm10_ug_m3=sensors.get("pm10"),
            air_index_level=payload.get("air_index_level"),
            source_locker_code=self.locker_code,
            humidity_pct=sensors.get("humidity"),
        )
        return InPostAirReading(
            air_quality=air_quality,
            temperature_c=sensors.get("temperature"),
        )
