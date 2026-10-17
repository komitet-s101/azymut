from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from backend.api.schemas.catalog import (
    OpeningHoursOut,
    PaginatedPlaces,
    PlaceDetailOut,
    place_to_out,
)
from backend.services import catalog

router = APIRouter(prefix="/places", tags=["places"])


@router.get("", response_model=PaginatedPlaces)
async def list_places(
    city: str | None = None,
    gmina: str | None = None,
    category: str | None = None,
    budget_max_pln: int | None = None,
    max_visit_minutes: int | None = None,
    day_of_week: int | None = Query(None, ge=0, le=6),
    window_start: str | None = Query(None, pattern=r"^\d{2}:\d{2}$"),
    window_end: str | None = Query(None, pattern=r"^\d{2}:\d{2}$"),
    adult_only: bool | None = None,
    is_indoor: bool | None = None,
    is_outdoor: bool | None = None,
    min_family_friendly: int | None = Query(None, ge=0, le=5),
    lat: float | None = None,
    lon: float | None = None,
    radius_km: float | None = Query(None, gt=0),
    sort: str | None = Query(None, pattern="^(distance|name)$"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> PaginatedPlaces:
    if (lat is None) ^ (lon is None):
        raise HTTPException(
            status_code=422,
            detail="lat and lon must be provided together",
        )
    if lat is not None and lon is not None:
        effective_sort = sort if sort is not None else "distance"
    else:
        effective_sort = "name" if sort is None else sort
        if effective_sort == "distance":
            effective_sort = "name"

    page, total = await catalog.list_places(
        city=city,
        gmina=gmina,
        category=category,
        budget_max_pln=budget_max_pln,
        max_visit_minutes=max_visit_minutes,
        day_of_week=day_of_week,
        window_start=window_start,
        window_end=window_end,
        adult_only=adult_only,
        is_indoor=is_indoor,
        is_outdoor=is_outdoor,
        min_family_friendly=min_family_friendly,
        lat=lat,
        lon=lon,
        radius_km=radius_km,
        sort=effective_sort,
        limit=limit,
        offset=offset,
    )
    items = [place_to_out(p, d) for p, d in page]
    return PaginatedPlaces(items=items, total=total, limit=limit, offset=offset)


@router.get("/{place_id}", response_model=PlaceDetailOut)
async def get_place(place_id: int) -> PlaceDetailOut:
    place = await catalog.get_place_detail(place_id)
    if place is None:
        raise HTTPException(status_code=404, detail="Place not found")
    hours = [
        OpeningHoursOut.model_validate(h)
        for h in sorted(place.opening_hours, key=lambda x: x.day_of_week)
    ]
    base = place_to_out(place)
    return PlaceDetailOut(**base.model_dump(), opening_hours=hours)
