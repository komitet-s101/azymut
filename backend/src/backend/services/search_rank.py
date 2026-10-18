from __future__ import annotations

from dataclasses import dataclass

from backend.api.schemas.plan import UserProfile
from backend.api.schemas.search import PlaceCategory, SearchFilter, SettingPreference
from backend.services.search_preferences import InterestLayers

_PRIMARY_CATEGORY = 6.0
_SECONDARY_CATEGORY = 2.5
_PREF_PRIMARY_CATEGORY = 2.4
_PREF_SECONDARY_CATEGORY = 1.0
_PREF_SIGNAL_SCALE = 0.45
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
_EVENT_INTENT_BONUS = 2.5
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
    game_interactivity: int = 0
    gastro_intensity: int = 0
    cultural_education: int = 0
    nature_relaxation: int = 0
    kind: str = "place"


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


def _profile_score(item: ScoreInput, profile: UserProfile | None) -> float:
    if profile is None:
        return 0.0
    score = 0.0
    score += item.game_interactivity * (profile.likes_games / 5) * 0.35
    score += item.physical_activity_level * (
        profile.physical_activity_preference / 5
    ) * 0.35
    gastro_pref = profile.gastro_intensity_preference
    if profile.bmi is not None and profile.bmi >= 27:
        gastro_pref = min(gastro_pref, 2)
    score += (5 - abs(item.gastro_intensity - gastro_pref)) * 0.08
    if profile.prefer_outdoor and item.is_outdoor:
        score += 1.2
    elif not profile.prefer_outdoor and item.is_indoor:
        score += 0.4
    score += item.cultural_education * 0.06
    score += item.nature_relaxation * 0.06
    return score


def _interest_category_score(
    item: ScoreInput,
    layers: InterestLayers,
) -> float:
    query_ids = {category.value for category in layers.query}
    pref_ids = {category.value for category in layers.preference}
    primary_ids = query_ids if query_ids else pref_ids
    soft_ids = pref_ids if query_ids else set()

    score = 0.0
    if item.category and item.category in primary_ids:
        score += _PRIMARY_CATEGORY
    elif item.category and item.category in soft_ids:
        score += _PREF_PRIMARY_CATEGORY

    if item.secondary_categories:
        secondary_q = sum(1 for cat in item.secondary_categories if cat in primary_ids)
        secondary_p = sum(1 for cat in item.secondary_categories if cat in soft_ids)
        score += secondary_q * _SECONDARY_CATEGORY
        score += secondary_p * _PREF_SECONDARY_CATEGORY
    return score


def _sport_interest_bonus(item: ScoreInput, layers: InterestLayers) -> float:
    query_ids = {category.value for category in layers.query}
    pref_ids = {category.value for category in layers.preference}
    sport = _SPORT.value
    if sport in query_ids or (sport in pref_ids and not query_ids):
        return item.physical_activity_level * _SPORT_ACTIVITY
    if sport in pref_ids:
        return item.physical_activity_level * _SPORT_ACTIVITY * _PREF_SIGNAL_SCALE
    return 0.0


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
    profile: UserProfile | None = None,
    interest_layers: InterestLayers | None = None,
) -> float:
    score = _EVENT_BONUS if item.kind == "event" else 0.0
    if item.kind == "event" and event_intent:
        score += _EVENT_INTENT_BONUS
    layers = interest_layers or InterestLayers(
        query=tuple(filt.interests),
        preference=(),
    )
    score += _interest_category_score(item, layers)
    score += _sport_interest_bonus(item, layers)

    kids = filt.group.children > 0 or bool(filt.group.child_ages)
    if kids:
        score += item.family_friendly * _FAMILY
    score += _age_score(item, filt)
    score += _profile_score(item, profile)
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
    return score


def rank_matches(
    items: list[ScoreInput],
    filt: SearchFilter,
    weather: WeatherBias,
    *,
    event_intent: bool = False,
    profile: UserProfile | None = None,
    interest_layers: InterestLayers | None = None,
) -> list[tuple[ScoreInput, float]]:
    scored = [
        (
            item,
            score_match(
                item,
                filt,
                weather,
                event_intent=event_intent,
                profile=profile,
                interest_layers=interest_layers,
            ),
        )
        for item in items
    ]
    scored.sort(key=lambda pair: (-pair[1], pair[0].key))
    return scored
