from __future__ import annotations

from dataclasses import dataclass

from backend.api.schemas.search import PlaceCategory, SearchFilter, SettingPreference

_PRIMARY_CATEGORY = 6.0
_SECONDARY_CATEGORY = 2.5
_SPORT_ACTIVITY = 0.9
_FAMILY = 0.7
_OUTDOOR_ONLY = 3.0
_OUTDOOR_MIXED = 1.5
_SETTING_MISS = 1.5
_AGE_OK = 0.5
_AGE_PENALTY_PER_YEAR = 0.35
_UNKNOWN_PRICE_STRICT = 2.5
_UNKNOWN_PRICE_SOFT = 1.5
_RAIN_SUITABLE = 0.7
_RAIN_INDOOR = 2.5
_RAIN_OUTDOOR_ONLY = 3.5
_SUNNY_OUTDOOR = 1.0
_EVENT_BONUS = 0.4
_EVENT_INTENT_BONUS = 5.0
_SPORT = PlaceCategory.SPORT_AKTYWNY_WYPOCZYNEK


@dataclass(frozen=True)
class WeatherBias:
    raining: bool
    condition: str | None = None
    used: bool = False


@dataclass(frozen=True)
class ScoreInput:
    key: str
    category: str | None
    secondary_categories: tuple[str, ...] = ()
    family_friendly: int = 0
    rain_suitable: int = 0
    physical_activity_level: int = 0
    is_indoor: bool = False
    is_outdoor: bool = False
    min_age_recommended: int | None = None
    price_level: int | None = None
    kind: str = "place"
    score_adjustment: float = 0.0


def _setting_score(item: ScoreInput, preference: SettingPreference) -> float:
    if preference is SettingPreference.EITHER:
        return 0.0
    if preference is SettingPreference.OUTDOOR:
        if item.is_outdoor and not item.is_indoor:
            return _OUTDOOR_ONLY
        if item.is_outdoor:
            return _OUTDOOR_MIXED
        if item.is_indoor:
            return -_SETTING_MISS
        return 0.0
    if preference is SettingPreference.INDOOR:
        if item.is_indoor and not item.is_outdoor:
            return _OUTDOOR_ONLY
        if item.is_indoor:
            return _OUTDOOR_MIXED
        if item.is_outdoor:
            return -_SETTING_MISS
        return 0.0
    never: never = preference
    return never


def _age_score(item: ScoreInput, filt: SearchFilter) -> float:
    kids = filt.group.children > 0 or bool(filt.group.child_ages)
    if not kids or item.min_age_recommended is None:
        return 0.0
    if filt.group.child_ages:
        youngest = min(filt.group.child_ages)
        if item.min_age_recommended > youngest:
            years = item.min_age_recommended - youngest
            return -min(4.0, years * _AGE_PENALTY_PER_YEAR)
        return _AGE_OK
    if item.min_age_recommended >= 16:
        return -1.5
    return 0.0


def score_match(
    item: ScoreInput,
    filt: SearchFilter,
    weather: WeatherBias,
    *,
    event_intent: bool = False,
) -> float:
    score = _EVENT_BONUS if item.kind == "event" else 0.0
    if item.kind == "event" and event_intent:
        score += _EVENT_INTENT_BONUS
    interests = {category.value for category in filt.interests}
    if item.category and item.category in interests:
        score += _PRIMARY_CATEGORY
    secondary_hits = sum(1 for category in item.secondary_categories if category in interests)
    score += secondary_hits * _SECONDARY_CATEGORY

    if _SPORT.value in interests:
        score += item.physical_activity_level * _SPORT_ACTIVITY

    kids = filt.group.children > 0 or bool(filt.group.child_ages)
    if kids:
        score += item.family_friendly * _FAMILY
    score += _age_score(item, filt)
    score += _setting_score(item, filt.setting)

    if item.price_level is None and filt.max_price_level == 0:
        score -= _UNKNOWN_PRICE_STRICT if filt.price_strict else _UNKNOWN_PRICE_SOFT

    if weather.raining:
        score += item.rain_suitable * _RAIN_SUITABLE
        if item.is_indoor:
            score += _RAIN_INDOOR
        if item.is_outdoor and not item.is_indoor:
            score -= _RAIN_OUTDOOR_ONLY
    elif item.is_outdoor:
        score += _SUNNY_OUTDOOR
    score += item.score_adjustment
    return score


def rank_matches(
    items: list[ScoreInput],
    filt: SearchFilter,
    weather: WeatherBias,
    *,
    event_intent: bool = False,
) -> list[tuple[ScoreInput, float]]:
    scored = [
        (item, score_match(item, filt, weather, event_intent=event_intent))
        for item in items
    ]
    scored.sort(key=lambda pair: (-pair[1], pair[0].key))
    return scored
