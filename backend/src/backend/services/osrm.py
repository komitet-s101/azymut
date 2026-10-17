from __future__ import annotations

import httpx

from backend.settings import Settings, get_settings

_OSRM_DEFAULT = "https://router.project-osrm.org"


class OsrmRoutingError(Exception):
    """Walking route could not be resolved."""


async def fetch_walking_route(
    waypoints: list[tuple[float, float]],
    *,
    settings: Settings | None = None,
) -> tuple[list[tuple[float, float]], float, float | None]:
    """Return (lat, lon) polyline, distance in km, duration in minutes."""
    resolved = settings or get_settings()
    base = (resolved.osrm_base_url or _OSRM_DEFAULT).rstrip("/")
    coord_path = ";".join(f"{lon},{lat}" for lat, lon in waypoints)
    url = f"{base}/route/v1/foot/{coord_path}"
    params = {"overview": "full", "geometries": "geojson", "steps": "false"}

    try:
        async with httpx.AsyncClient(timeout=resolved.osrm_timeout_seconds) as client:
            response = await client.get(url, params=params)
    except (httpx.TimeoutException, httpx.RequestError) as exc:
        raise OsrmRoutingError(str(exc)) from exc

    if response.status_code >= 400:
        raise OsrmRoutingError(f"OSRM HTTP {response.status_code}")

    try:
        payload = response.json()
        routes = payload["routes"]
        route = routes[0]
        geometry = route["geometry"]["coordinates"]
        distance_m = float(route["distance"])
        duration_s = float(route.get("duration", 0))
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise OsrmRoutingError("Unexpected OSRM response") from exc

    if not geometry:
        raise OsrmRoutingError("Empty route geometry")

    coordinates = [(float(lat), float(lon)) for lon, lat in geometry]
    duration_minutes = duration_s / 60.0 if duration_s > 0 else None
    return coordinates, distance_m / 1000.0, duration_minutes
