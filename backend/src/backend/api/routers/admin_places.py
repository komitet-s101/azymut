from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from backend.api.schemas.admin import OpeningHoursIn, PlaceCreate, PlaceUpdate
from backend.api.schemas.catalog import PaginatedPlaces, PlaceDetailOut, place_to_out
from backend.api.schemas.orm import OpeningHoursOut
from backend.services import admin_catalog, catalog

router = APIRouter(prefix="/admin/places", tags=["admin"])


@router.get("", response_model=PaginatedPlaces)
async def admin_list_places(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> PaginatedPlaces:
    places, total = await admin_catalog.admin_list_places(limit, offset)
    items = [place_to_out(p, None) for p in places]
    return PaginatedPlaces(items=items, total=total, limit=limit, offset=offset)


def _place_detail_out(place) -> PlaceDetailOut:
    hours = [
        OpeningHoursOut.model_validate(h)
        for h in sorted(place.opening_hours, key=lambda x: x.day_of_week)
    ]
    base = place_to_out(place)
    return PlaceDetailOut(**base.model_dump(), opening_hours=hours)


@router.post("", response_model=PlaceDetailOut, status_code=201)
async def admin_create_place(body: PlaceCreate) -> PlaceDetailOut:
    place = await admin_catalog.admin_create_place(body)
    detail = await catalog.get_place_detail(place.id)
    assert detail is not None
    return _place_detail_out(detail)


@router.patch("/{place_id}", response_model=PlaceDetailOut)
async def admin_update_place(place_id: int, body: PlaceUpdate) -> PlaceDetailOut:
    place = await admin_catalog.admin_update_place(place_id, body)
    if place is None:
        raise HTTPException(status_code=404, detail="Place not found")
    detail = await catalog.get_place_detail(place_id)
    assert detail is not None
    return _place_detail_out(detail)


@router.delete("/{place_id}", status_code=204)
async def admin_delete_place(place_id: int) -> None:
    if not await admin_catalog.admin_delete_place(place_id):
        raise HTTPException(status_code=404, detail="Place not found")


@router.put("/{place_id}/opening-hours", response_model=list[OpeningHoursOut])
async def admin_replace_opening_hours(
    place_id: int,
    body: list[OpeningHoursIn],
) -> list[OpeningHoursOut]:
    rows = await admin_catalog.admin_replace_opening_hours(place_id, body)
    if rows is None:
        raise HTTPException(status_code=404, detail="Place not found")
    return [OpeningHoursOut.model_validate(r) for r in rows]
