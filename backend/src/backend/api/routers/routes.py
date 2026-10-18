from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from backend.api.schemas.catalog import (
    PaginatedRoutes,
    RouteDetailOut,
    RouteStopOut,
    route_to_out,
)
from backend.db.models import PriceLevel
from backend.services import catalog

router = APIRouter(prefix="/routes", tags=["routes"])


@router.get("", response_model=PaginatedRoutes)
async def list_routes(
    city: str | None = None,
    gmina: str | None = None,
    max_duration_minutes: int | None = None,
    max_price_level: PriceLevel | None = None,
    lat: float | None = None,
    lon: float | None = None,
    radius_km: float | None = Query(None, gt=0),
    limit: int = Query(20, ge=1, le=150),
    offset: int = Query(0, ge=0),
) -> PaginatedRoutes:
    if (lat is None) ^ (lon is None):
        raise HTTPException(
            status_code=422,
            detail="lat and lon must be provided together",
        )

    page, total = await catalog.list_routes(
        city=city,
        gmina=gmina,
        max_duration_minutes=max_duration_minutes,
        max_price_level=max_price_level,
        lat=lat,
        lon=lon,
        radius_km=radius_km,
        limit=limit,
        offset=offset,
    )
    items = [route_to_out(r, d) for r, d in page]
    return PaginatedRoutes(items=items, total=total, limit=limit, offset=offset)


@router.get("/{route_id}", response_model=RouteDetailOut)
async def get_route(route_id: int) -> RouteDetailOut:
    route = await catalog.get_route_detail(route_id)
    if route is None:
        raise HTTPException(status_code=404, detail="Route not found")

    stops_out = [
        RouteStopOut.model_validate(stop) for stop in catalog.route_stops_ordered(route)
    ]
    base = route_to_out(route)
    return RouteDetailOut(**base.model_dump(), stops=stops_out)
