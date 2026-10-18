from __future__ import annotations

from typing import Any

from tortoise.expressions import Q
from tortoise.queryset import QuerySet

from backend.api.geo import haversine_km
from backend.db.models import Event, OpeningHours, Place, PredefinedRoute, PriceLevel
from backend.services.search import warsaw_today


def _budget_filter(budget_max_pln: int | None) -> Q | None:
    if budget_max_pln is None:
        return None
    return Q(price_level=PriceLevel.FREE) | Q(price_max_pln__lte=budget_max_pln)


async def filter_places_by_opening(
    place_ids: list[int],
    day_of_week: int,
    window_start: str,
    window_end: str,
) -> set[int]:
    if not place_ids:
        return set()
    hours = await OpeningHours.filter(
        place_id__in=place_ids,
        day_of_week=day_of_week,
        opens_at__lte=window_start,
        closes_at__gte=window_end,
    ).values_list("place_id", flat=True)
    return set(hours)


async def list_places(
    *,
    city: str | None = None,
    gmina: str | None = None,
    category: str | None = None,
    budget_max_pln: int | None = None,
    max_visit_minutes: int | None = None,
    day_of_week: int | None = None,
    window_start: str | None = None,
    window_end: str | None = None,
    adult_only: bool | None = None,
    is_indoor: bool | None = None,
    is_outdoor: bool | None = None,
    min_family_friendly: int | None = None,
    lat: float | None = None,
    lon: float | None = None,
    radius_km: float | None = None,
    sort: str = "name",
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[tuple[Place, float | None]], int]:
    qs: QuerySet[Place] = Place.all()
    if city:
        qs = qs.filter(city=city)
    if gmina:
        qs = qs.filter(gmina=gmina)
    if category:
        qs = qs.filter(category=category)
    if max_visit_minutes is not None:
        qs = qs.filter(typical_visit_minutes__lte=max_visit_minutes)
    if adult_only is False:
        qs = qs.filter(adult_only=False)
    elif adult_only is True:
        qs = qs.filter(adult_only=True)
    if is_indoor is not None:
        qs = qs.filter(is_indoor=is_indoor)
    if is_outdoor is not None:
        qs = qs.filter(is_outdoor=is_outdoor)
    if min_family_friendly is not None:
        qs = qs.filter(family_friendly__gte=min_family_friendly)

    budget_q = _budget_filter(budget_max_pln)
    if budget_q is not None:
        qs = qs.filter(budget_q)

    places = await qs.all()
    place_ids = [p.id for p in places]

    if (
        day_of_week is not None
        and window_start
        and window_end
        and place_ids
    ):
        open_ids = await filter_places_by_opening(
            place_ids,
            day_of_week,
            window_start,
            window_end,
        )
        places = [p for p in places if p.id in open_ids]

    use_distance = lat is not None and lon is not None
    scored: list[tuple[Place, float | None]] = []
    for place in places:
        dist: float | None = None
        if use_distance:
            dist = haversine_km(lat, lon, place.latitude, place.longitude)
            if radius_km is not None and dist > radius_km:
                continue
        scored.append((place, dist))

    if use_distance and sort == "distance":
        scored.sort(key=lambda x: x[1] if x[1] is not None else float("inf"))
    else:
        scored.sort(key=lambda x: x[0].name.lower())

    total = len(scored)
    page = scored[offset : offset + limit]
    return page, total


async def get_place_detail(place_id: int) -> Place | None:
    return await Place.filter(id=place_id).prefetch_related("opening_hours").first()


async def list_routes(
    *,
    city: str | None = None,
    gmina: str | None = None,
    max_duration_minutes: int | None = None,
    max_price_level: PriceLevel | None = None,
    lat: float | None = None,
    lon: float | None = None,
    radius_km: float | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[tuple[PredefinedRoute, float | None]], int]:
    qs: QuerySet[PredefinedRoute] = PredefinedRoute.all()
    if city:
        qs = qs.filter(city=city)
    if gmina:
        qs = qs.filter(gmina=gmina)
    if max_duration_minutes is not None:
        qs = qs.filter(duration_minutes_approx__lte=max_duration_minutes)
    if max_price_level is not None:
        qs = qs.filter(
            Q(price_level_max__lte=max_price_level) | Q(price_level_max__isnull=True)
        )

    routes = await qs.prefetch_related("stops__place").all()
    use_distance = lat is not None and lon is not None
    scored: list[tuple[PredefinedRoute, float | None]] = []

    for route in routes:
        dist: float | None = None
        if use_distance:
            stops = sorted(route.stops, key=lambda s: s.sequence)
            if stops:
                first = stops[0].place
                dist = haversine_km(lat, lon, first.latitude, first.longitude)
                if radius_km is not None and dist > radius_km:
                    continue
        scored.append((route, dist))

    if use_distance:
        scored.sort(key=lambda x: x[1] if x[1] is not None else float("inf"))
    else:
        scored.sort(key=lambda x: x[0].name.lower())

    total = len(scored)
    page = scored[offset : offset + limit]
    return page, total


async def list_events(
    *,
    upcoming_only: bool = True,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[Event], int]:
    qs: QuerySet[Event] = Event.all().order_by("start_date", "start_time")
    if upcoming_only:
        qs = qs.filter(start_date__gte=warsaw_today())
    total = await qs.count()
    rows = await qs.offset(offset).limit(limit)
    return list(rows), total


async def get_route_detail(route_id: int) -> PredefinedRoute | None:
    return (
        await PredefinedRoute.filter(id=route_id)
        .prefetch_related("stops__place")
        .first()
    )


def route_stops_ordered(route: PredefinedRoute) -> list[Any]:
    return sorted(route.stops, key=lambda s: s.sequence)
