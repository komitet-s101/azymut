from __future__ import annotations

import httpx

from backend.settings import Settings, get_settings

_OSRM_DEFAULT = "https://router.project-osrm.org"
_USER_AGENT = "Azymut/1.0 (walking routes; +https://github.com/azymut)"


class OsrmRoutingError(Exception):
    """Walking route could not be resolved."""


def _merge_leg_geometries(legs: list[list[tuple[float, float]]]) -> list[tuple[float, float]]:
    merged: list[tuple[float, float]] = []
    for leg in legs:
        if not leg:
            continue
        if not merged:
            merged.extend(leg)
            continue
        start = leg[0]
        if merged[-1] == start:
            merged.extend(leg[1:])
        else:
            merged.extend(leg)
    return merged


async def _request_osrm_route(
    waypoints: list[tuple[float, float]],
    *,
    settings: Settings,
) -> tuple[list[tuple[float, float]], float, float | None]:
    base = (settings.osrm_base_url or _OSRM_DEFAULT).rstrip("/")
    coord_path = ";".join(f"{lon},{lat}" for lat, lon in waypoints)
    url = f"{base}/route/v1/foot/{coord_path}"
    params = {"overview": "full", "geometries": "geojson", "steps": "false"}
    headers = {"User-Agent": _USER_AGENT}

    try:
        async with httpx.AsyncClient(timeout=settings.osrm_timeout_seconds) as client:
            response = await client.get(url, params=params, headers=headers)
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


async def fetch_walking_route(
    waypoints: list[tuple[float, float]],
    *,
    settings: Settings | None = None,
) -> tuple[list[tuple[float, float]], float, float | None]:
    """Return (lat, lon) polyline, distance in km, duration in minutes."""
    if len(waypoints) < 2:
        raise OsrmRoutingError("At least two waypoints required")

    resolved = settings or get_settings()

    if len(waypoints) == 2:
        coordinates, distance_km, duration_minutes = await _request_osrm_route(
            waypoints,
            settings=resolved,
        )
    elif len(waypoints) > 8:
        coordinates, distance_km, duration_minutes = await _fetch_chained_legs(
            waypoints,
            settings=resolved,
        )
    else:
        try:
            coordinates, distance_km, duration_minutes = await _request_osrm_route(
                waypoints,
                settings=resolved,
            )
        except OsrmRoutingError:
            coordinates, distance_km, duration_minutes = await _fetch_chained_legs(
                waypoints,
                settings=resolved,
            )

    if len(coordinates) < 2:
        raise OsrmRoutingError("Route geometry too short")
    return coordinates, distance_km, duration_minutes


async def _fetch_chained_legs(
    waypoints: list[tuple[float, float]],
    *,
    settings: Settings,
) -> tuple[list[tuple[float, float]], float, float | None]:
    legs: list[list[tuple[float, float]]] = []
    total_km = 0.0
    total_minutes = 0.0
    has_duration = True

    for index in range(len(waypoints) - 1):
        leg_coords, leg_km, leg_minutes = await _request_osrm_route(
            [waypoints[index], waypoints[index + 1]],
            settings=settings,
        )
        legs.append(leg_coords)
        total_km += leg_km
        if leg_minutes is None:
            has_duration = False
        else:
            total_minutes += leg_minutes

    merged = _merge_leg_geometries(legs)
    if len(merged) < 2:
        raise OsrmRoutingError("Chained route geometry too short")
    duration = total_minutes if has_duration else None
    return merged, total_km, duration
