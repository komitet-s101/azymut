from __future__ import annotations

from backend.api.schemas.admin import (
    OpeningHoursIn,
    PlaceCreate,
    PlaceUpdate,
    RouteCreate,
    RouteStopIn,
    RouteUpdate,
)
from backend.db.models import OpeningHours, Place, PredefinedRoute, RouteStop


async def admin_list_places(limit: int, offset: int) -> tuple[list[Place], int]:
    total = await Place.all().count()
    places = await Place.all().order_by("id").offset(offset).limit(limit)
    return places, total


async def admin_create_place(data: PlaceCreate) -> Place:
    return await Place.create(**data.model_dump())


async def admin_update_place(place_id: int, data: PlaceUpdate) -> Place | None:
    place = await Place.filter(id=place_id).first()
    if place is None:
        return None
    updates = data.model_dump(exclude_unset=True)
    if updates:
        await place.update_from_dict(updates)
        await place.save()
    return place


async def admin_delete_place(place_id: int) -> bool:
    deleted = await Place.filter(id=place_id).delete()
    return deleted > 0


async def admin_replace_opening_hours(
    place_id: int,
    hours: list[OpeningHoursIn],
) -> list[OpeningHours] | None:
    place = await Place.filter(id=place_id).first()
    if place is None:
        return None
    await OpeningHours.filter(place_id=place_id).delete()
    created: list[OpeningHours] = []
    for row in hours:
        created.append(
            await OpeningHours.create(
                place_id=place_id,
                day_of_week=row.day_of_week,
                opens_at=row.opens_at,
                closes_at=row.closes_at,
            )
        )
    return created


async def admin_list_routes(limit: int, offset: int) -> tuple[list[PredefinedRoute], int]:
    total = await PredefinedRoute.all().count()
    routes = (
        await PredefinedRoute.all()
        .order_by("id")
        .offset(offset)
        .limit(limit)
        .prefetch_related("stops__place")
    )
    return routes, total


async def admin_create_route(data: RouteCreate) -> PredefinedRoute:
    return await PredefinedRoute.create(**data.model_dump())


async def admin_update_route(route_id: int, data: RouteUpdate) -> PredefinedRoute | None:
    route = await PredefinedRoute.filter(id=route_id).first()
    if route is None:
        return None
    updates = data.model_dump(exclude_unset=True)
    if updates:
        await route.update_from_dict(updates)
        await route.save()
    return route


async def admin_delete_route(route_id: int) -> bool:
    deleted = await PredefinedRoute.filter(id=route_id).delete()
    return deleted > 0


async def admin_replace_route_stops(
    route_id: int,
    stops: list[RouteStopIn],
) -> list[RouteStop] | None:
    route = await PredefinedRoute.filter(id=route_id).first()
    if route is None:
        return None
    sequences = [s.sequence for s in stops]
    if len(sequences) != len(set(sequences)):
        raise ValueError("Duplicate sequence values in route stops")
    place_ids = [s.place_id for s in stops]
    existing = await Place.filter(id__in=place_ids).count()
    if existing != len(set(place_ids)):
        raise ValueError("One or more place_id values do not exist")

    await RouteStop.filter(route_id=route_id).delete()
    created: list[RouteStop] = []
    for row in stops:
        created.append(
            await RouteStop.create(
                route_id=route_id,
                place_id=row.place_id,
                sequence=row.sequence,
                dwell_minutes=row.dwell_minutes,
            )
        )
    return created
