from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from backend.api.schemas.weather import WeatherForecast, WeatherProviderError, WeatherSnapshot
from backend.services import catalog
from backend.services.weather import get_weather_service

router = APIRouter(prefix="/weather", tags=["weather"])


async def _resolve_coords(
    lat: float | None,
    lon: float | None,
    city: str | None,
    gmina: str | None,
) -> tuple[float, float]:
    if lat is not None and lon is not None:
        return lat, lon
    if not city:
        raise HTTPException(
            status_code=422,
            detail="Provide lat and lon together, or city",
        )
    places, total = await catalog.list_places(city=city, gmina=gmina, limit=500, offset=0)
    if total == 0:
        raise HTTPException(
            status_code=422,
            detail=f"No catalog places found for city={city!r}",
        )
    sum_lat = sum(p.latitude for p, _ in places)
    sum_lon = sum(p.longitude for p, _ in places)
    count = len(places)
    return sum_lat / count, sum_lon / count


@router.get("/current", response_model=WeatherSnapshot)
async def weather_current(
    lat: float | None = None,
    lon: float | None = None,
    city: str | None = None,
    gmina: str | None = None,
) -> WeatherSnapshot:
    if (lat is None) ^ (lon is None):
        raise HTTPException(status_code=422, detail="lat and lon must be provided together")
    resolved_lat, resolved_lon = await _resolve_coords(lat, lon, city, gmina)
    service = get_weather_service()
    try:
        return await service.get_current(resolved_lat, resolved_lon)
    except WeatherProviderError as exc:
        raise HTTPException(
            status_code=502,
            detail={"message": str(exc), "provider": exc.provider},
        ) from exc


@router.get("/forecast", response_model=WeatherForecast)
async def weather_forecast(
    lat: float = Query(...),
    lon: float = Query(...),
    hours: int = Query(24, ge=1, le=72),
) -> WeatherForecast:
    service = get_weather_service()
    try:
        return await service.get_forecast(lat, lon, hours)
    except WeatherProviderError as exc:
        raise HTTPException(
            status_code=502,
            detail={"message": str(exc), "provider": exc.provider},
        ) from exc
