from __future__ import annotations

from datetime import date, timedelta

from backend.api.schemas.search import (
    SearchFilter,
    SearchResult,
    SearchUserPreferences,
    TouristGeographyScope,
)
from backend.db.models import Event
from backend.services.search import (
    _event_blocked,
    _event_category,
    _event_flags,
    _event_price,
    _minutes_between,
    warsaw_today,
)
from backend.services.search_preferences import (
    InterestLayers,
    merge_user_preferences,
    preference_interest_categories,
)
from backend.services.search_rank import ScoreInput, WeatherBias, rank_matches

_HORIZON_DAYS = 120
_SOON_BONUS_MAX = 2.5
_SOON_BONUS_DECAY = 0.04


def _event_sort_key(event: Event) -> tuple[date, str]:
    return (event.start_date, event.start_time or "99:99")


def _event_in_plock_city(event: Event) -> bool:
    city = (event.city or "").casefold().strip()
    if not city:
        return True
    return "płock" in city and "sierpc" not in city and "gostynin" not in city


def _soon_bonus(event: Event, today: date) -> float:
    days_ahead = (event.start_date - today).days
    if days_ahead < 0:
        return 0.0
    return max(0.0, _SOON_BONUS_MAX - days_ahead * _SOON_BONUS_DECAY)


def _score_input_for_event(event: Event) -> ScoreInput:
    category = _event_category(event)
    activity = (
        4 if category == "sport_aktywny_wypoczynek" else 1 if event.sport else 0
    )
    return ScoreInput(
        key=f"event:{event.id}",
        category=category,
        family_friendly=2,
        rain_suitable=2,
        physical_activity_level=activity,
        price_level=_event_price(event),
        kind="event",
    )


def _to_search_result(event: Event, score: float) -> SearchResult:
    return SearchResult(
        kind="event",
        id=event.id,
        name=event.name,
        category=_event_category(event),
        city=event.city,
        score=round(score, 2),
        flags=_event_flags(event),
        price_level=_event_price(event),
        typical_visit_minutes=_minutes_between(event.start_time, event.end_time),
        address_line=event.address_line,
        latitude=event.latitude,
        longitude=event.longitude,
        start_date=event.start_date,
        start_time=event.start_time,
        venue_name=event.venue_name,
        description=event.description,
    )


async def upcoming_events_for_home(
    *,
    limit: int = 4,
    user_preferences: SearchUserPreferences | None = None,
    today: date | None = None,
) -> list[SearchResult]:
    resolved_today = today or warsaw_today()
    horizon = resolved_today + timedelta(days=_HORIZON_DAYS)
    rows = await Event.filter(
        start_date__gte=resolved_today,
        start_date__lte=horizon,
    ).order_by("start_date", "start_time")

    pref_categories = preference_interest_categories(user_preferences)
    filt = merge_user_preferences(SearchFilter(), user_preferences)
    if pref_categories:
        filt = filt.model_copy(update={"interests": pref_categories})

    interest_layers = InterestLayers(
        query=tuple(pref_categories),
        preference=(),
    )
    profile = user_preferences.profile if user_preferences is not None else None
    weather = WeatherBias(raining=False, used=False)

    plock_city_only = (
        user_preferences is not None
        and user_preferences.tourist_geography_scope is TouristGeographyScope.PLOCK_CITY
    )

    candidates: list[Event] = []
    for event in rows:
        if event.status and event.status not in ("upcoming", "scheduled"):
            continue
        if plock_city_only and not _event_in_plock_city(event):
            continue
        if _event_blocked(event, filt):
            continue
        candidates.append(event)

    if not candidates:
        return []

    scored_inputs = [_score_input_for_event(event) for event in candidates]
    ranked = rank_matches(
        scored_inputs,
        filt,
        weather,
        event_intent=True,
        profile=profile,
        interest_layers=interest_layers,
    )
    event_by_key = {f"event:{event.id}": event for event in candidates}

    def _rank_key(pair: tuple[ScoreInput, float]) -> tuple[float, date, str]:
        event = event_by_key[pair[0].key]
        total = pair[1] + _soon_bonus(event, resolved_today)
        sort_date, sort_time = _event_sort_key(event)
        return (-total, sort_date, sort_time)

    ranked.sort(key=_rank_key)

    results: list[SearchResult] = []
    for item, score in ranked[:limit]:
        event = event_by_key[item.key]
        total_score = score + _soon_bonus(event, resolved_today)
        results.append(_to_search_result(event, total_score))
    return results
