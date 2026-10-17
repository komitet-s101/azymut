from __future__ import annotations

import json
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from backend.api.schemas.plan import PlanRequest
from backend.db.config import INTEREST_PACKAGES_PATH
from backend.db.models import OpeningHours, Place, PriceLevel, PredefinedRoute
from backend.services import catalog

MAX_ROUTE_CANDIDATES = 5
MAX_PLACE_CANDIDATES = 15


@dataclass
class PlannerCandidates:
    routes: list[dict[str, Any]]
    places: list[dict[str, Any]]
    route_ids: set[int]
    place_ids: set[int]


def _load_interest_package(package_id: str) -> dict[str, Any] | None:
    if not INTEREST_PACKAGES_PATH.is_file():
        return None
    raw = json.loads(INTEREST_PACKAGES_PATH.read_text(encoding="utf-8"))
    for item in raw:
        if item.get("id") == package_id:
            return item
    return None


def _price_level_from_budget(budget_max_pln: int) -> PriceLevel | None:
    if budget_max_pln <= 0:
        return PriceLevel.FREE
    if budget_max_pln <= 30:
        return PriceLevel.LOW
    if budget_max_pln <= 80:
        return PriceLevel.MEDIUM
    return PriceLevel.HIGH


def _score_place(place: Place, request: PlanRequest) -> float:
    profile = request.profile
    score = 0.0
    score += place.family_friendly * 0.15
    score += place.rain_suitable * 0.1
    score += place.cultural_education * 0.1
    score += place.nature_relaxation * 0.1
    score += place.game_interactivity * (profile.likes_games / 5) * 0.2
    score += place.physical_activity_level * (
        profile.physical_activity_preference / 5
    ) * 0.2
    gastro_pref = profile.gastro_intensity_preference
    if profile.bmi is not None and profile.bmi >= 27:
        gastro_pref = min(gastro_pref, 2)
    score += (5 - abs(place.gastro_intensity - gastro_pref)) * 0.1
    if profile.prefer_outdoor and place.is_outdoor:
        score += 1.5
    if not profile.prefer_outdoor and place.is_indoor:
        score += 0.5
    return score


async def _opens_today(place_id: int, day_of_week: int) -> str | None:
    row = await OpeningHours.filter(
        place_id=place_id,
        day_of_week=day_of_week,
    ).first()
    if row is None:
        return None
    return f"{row.opens_at}-{row.closes_at}"


def _place_to_candidate(
    place: Place,
    opens_today: str | None,
) -> dict[str, Any]:
    price_max: float | None = None
    if place.price_max_pln is not None:
        price_max = float(place.price_max_pln)
    return {
        "place_id": place.id,
        "name": place.name,
        "category": place.category,
        "typical_visit_minutes": place.typical_visit_minutes,
        "price_level": int(place.price_level),
        "price_max_pln": price_max,
        "is_indoor": place.is_indoor,
        "is_outdoor": place.is_outdoor,
        "adult_only": place.adult_only,
        "min_age_recommended": place.min_age_recommended or 0,
        "gastro_intensity": place.gastro_intensity,
        "game_interactivity": place.game_interactivity,
        "physical_activity_level": place.physical_activity_level,
        "cultural_education": place.cultural_education,
        "nature_relaxation": place.nature_relaxation,
        "family_friendly": place.family_friendly,
        "rain_suitable": place.rain_suitable,
        "opens_today": opens_today,
    }


def _route_to_candidate(route: PredefinedRoute) -> dict[str, Any]:
    stops = sorted(route.stops, key=lambda s: s.sequence)
    stop_place_ids = [s.place_id for s in stops]
    price_max = (
        int(route.price_level_max) if route.price_level_max is not None else None
    )
    return {
        "route_id": route.id,
        "name": route.name,
        "duration_minutes_approx": route.duration_minutes_approx,
        "stops_min": route.stops_min,
        "stops_max": route.stops_max,
        "price_level_max": price_max,
        "stop_place_ids": stop_place_ids,
    }


async def fetch_planner_candidates(request: PlanRequest) -> PlannerCandidates:
    package = _load_interest_package(request.interest_package_id)
    suggested = (package or {}).get("suggested_constraints") or {}

    constraints = request.constraints
    kids = bool(constraints.party.kids_ages)
    adult_only = False if kids else None

    category: str | None = None
    categories = suggested.get("categories")
    if isinstance(categories, list) and len(categories) == 1:
        category = categories[0]

    lat = request.weather.lat if request.weather else None
    lon = request.weather.lon if request.weather else None

    route_page, _ = await catalog.list_routes(
        max_duration_minutes=constraints.available_minutes,
        max_price_level=_price_level_from_budget(constraints.budget_max_pln),
        lat=lat,
        lon=lon,
        limit=50,
        offset=0,
    )
    routes = [r for r, _ in route_page][:MAX_ROUTE_CANDIDATES]

    place_page, _ = await catalog.list_places(
        category=category,
        budget_max_pln=constraints.budget_max_pln,
        max_visit_minutes=constraints.available_minutes,
        day_of_week=constraints.day_of_week,
        window_start=constraints.window_start,
        window_end=constraints.window_end,
        adult_only=adult_only,
        is_indoor=suggested.get("is_indoor"),
        is_outdoor=None,
        min_family_friendly=suggested.get("min_family_friendly"),
        lat=lat,
        lon=lon,
        sort="distance" if lat is not None else "name",
        limit=80,
        offset=0,
    )
    places_scored: list[tuple[Place, float]] = []
    min_rain = suggested.get("min_rain_suitable")
    for place, _dist in place_page:
        if min_rain is not None and place.rain_suitable < int(min_rain):
            continue
        if isinstance(categories, list) and len(categories) > 1:
            if place.category not in categories:
                continue
        places_scored.append((place, _score_place(place, request)))

    places_scored.sort(key=lambda x: x[1], reverse=True)
    selected_places: dict[int, Place] = {p.id: p for p, _ in places_scored}

    for route in routes:
        for stop in route.stops:
            selected_places[stop.place_id] = stop.place

    top_places = list(selected_places.values())[:MAX_PLACE_CANDIDATES]
    top_places.sort(key=lambda p: _score_place(p, request), reverse=True)

    place_candidates: list[dict[str, Any]] = []
    for place in top_places:
        opens = await _opens_today(place.id, constraints.day_of_week)
        place_candidates.append(_place_to_candidate(place, opens))

    route_candidates = [_route_to_candidate(r) for r in routes]

    return PlannerCandidates(
        routes=route_candidates,
        places=place_candidates,
        route_ids={r["route_id"] for r in route_candidates},
        place_ids={p["place_id"] for p in place_candidates},
    )


def candidates_payload(candidates: PlannerCandidates) -> dict[str, Any]:
    return {
        "routes": candidates.routes,
        "places": candidates.places,
    }


def has_any_candidates(candidates: PlannerCandidates) -> bool:
    return bool(candidates.routes or candidates.places)
