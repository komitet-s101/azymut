from __future__ import annotations

from backend.api.schemas.search import (
    SearchResult,
    SearchResultFlag,
    SearchUserPreferences,
    TouristGeographyScope,
)
from backend.db.models import Place
from backend.llm.query_parser import DEFAULT_SEARCH_CITY
from backend.services.search import _place_flags, _price_int
from backend.services.search_preferences import preference_interest_categories


def _split_secondary(value: str | None) -> tuple[str, ...]:
    if not value:
        return ()
    return tuple(part.strip() for part in value.split(";") if part.strip())


def _place_matches_interests(place: Place, categories: set[str]) -> bool:
    if not categories:
        return True
    if place.category in categories:
        return True
    for secondary in _split_secondary(place.secondary_categories):
        if secondary in categories:
            return True
    return False


def _city_matches(place: Place, city: str | None) -> bool:
    if not city:
        return True
    place_city = (place.city or "").casefold().strip()
    if not place_city:
        return True
    return place_city == city.casefold().strip()


def _place_in_plock_city(place: Place) -> bool:
    city = (place.city or "").casefold().strip()
    if not city:
        return True
    return city == "płock" or city == "plock"


def _to_search_result(place: Place, score: float) -> SearchResult:
    flags = _place_flags(place, any_hours=set(), check_day=False)
    if place.price_level is None:
        flags.append(SearchResultFlag.PRICE_UNCONFIRMED)
    return SearchResult(
        kind="place",
        id=place.id,
        external_id=place.external_id,
        name=place.name,
        category=place.category,
        city=place.city,
        score=round(score, 2),
        flags=flags,
        price_level=_price_int(place.price_level),
        is_indoor=bool(place.is_indoor),
        is_outdoor=bool(place.is_outdoor),
        typical_visit_minutes=place.typical_visit_minutes,
        address_line=place.address_line,
        latitude=place.latitude,
        longitude=place.longitude,
        description=place.description,
    )


async def recommended_places_for_home(
    *,
    limit: int = 6,
    user_preferences: SearchUserPreferences | None = None,
) -> list[SearchResult]:
    """Miejsca na stronę główną: wybrane w onboardingu kategorie = `place.category` (lub secondary)."""
    pref_categories = preference_interest_categories(user_preferences)
    category_values = {item.value for item in pref_categories}

    scope = (
        user_preferences.tourist_geography_scope
        if user_preferences is not None
        else None
    )
    plock_city_only = scope is TouristGeographyScope.PLOCK_CITY
    restrict_to_plock = scope is not TouristGeographyScope.PLOCK_REGION

    kids = False
    if user_preferences and user_preferences.constraints:
        party = user_preferences.constraints.party
        kids = bool(party.kids_ages)

    rows = await Place.all().order_by("name")

    candidates: list[Place] = []
    for place in rows:
        if category_values and not _place_matches_interests(place, category_values):
            continue
        if restrict_to_plock and not _city_matches(place, DEFAULT_SEARCH_CITY):
            continue
        if plock_city_only and not _place_in_plock_city(place):
            continue
        if kids and place.adult_only:
            continue
        candidates.append(place)

    results: list[SearchResult] = []
    for index, place in enumerate(candidates[:limit]):
        results.append(_to_search_result(place, float(limit - index)))
    return results
