from __future__ import annotations

from backend.api.schemas.plan import PartyConstraints, UserConstraints, UserProfile
from backend.api.schemas.search import (
    PlaceCategory,
    SearchFilter,
    SearchGroup,
    SearchUserPreferences,
    SettingPreference,
    TouristGeographyScope,
)
from backend.services.search_preferences import (
    merge_user_preferences,
    resolve_interest_layers,
)
from backend.services.search_rank import ScoreInput, WeatherBias, rank_matches


def _prefs(**kwargs: object) -> SearchUserPreferences:
    return SearchUserPreferences.model_validate(kwargs)


def test_merge_does_not_add_onboarding_interests_to_filter() -> None:
    filt = SearchFilter(interests=[PlaceCategory.HISTORIA_ZABYTKI])
    merged = merge_user_preferences(
        filt,
        _prefs(interest_tag_ids=["sport_aktywny_wypoczynek", "custom"]),
    )
    values = {item.value for item in merged.interests}
    assert values == {"historia_zabytki"}


def test_resolve_query_interests_beat_onboarding_tags() -> None:
    layers = resolve_interest_layers(
        "muzeum w Płocku",
        [PlaceCategory.HISTORIA_ZABYTKI, PlaceCategory.SPORT_AKTYWNY_WYPOCZYNEK],
        _prefs(interest_tag_ids=["sport_aktywny_wypoczynek"]),
    )
    assert layers.query == (PlaceCategory.HISTORIA_ZABYTKI,)
    assert layers.preference == (PlaceCategory.SPORT_AKTYWNY_WYPOCZYNEK,)


def test_resolve_vague_query_uses_onboarding_as_primary() -> None:
    layers = resolve_interest_layers(
        "mam wolne 2 godziny",
        [PlaceCategory.SPORT_AKTYWNY_WYPOCZYNEK],
        _prefs(interest_tag_ids=["sport_aktywny_wypoczynek"]),
    )
    assert layers.query == ()
    assert layers.preference == (PlaceCategory.SPORT_AKTYWNY_WYPOCZYNEK,)


def test_query_topic_outranks_onboarding_in_ranking() -> None:
    layers = resolve_interest_layers(
        "zabytki w Płocku",
        [PlaceCategory.HISTORIA_ZABYTKI],
        _prefs(interest_tag_ids=["sport_aktywny_wypoczynek"]),
    )
    filt = SearchFilter()
    museum = ScoreInput(
        key="muzeum",
        category="historia_zabytki",
        family_friendly=3,
        rain_suitable=3,
        is_indoor=True,
    )
    sport = ScoreInput(
        key="orlik",
        category="sport_aktywny_wypoczynek",
        family_friendly=5,
        rain_suitable=5,
        physical_activity_level=5,
        is_indoor=True,
    )
    weather = WeatherBias(raining=False, used=False)
    ranked = rank_matches(
        [sport, museum],
        filt,
        weather,
        interest_layers=layers,
    )
    assert ranked[0][0].key == "muzeum"


def test_merge_applies_time_and_children_from_constraints() -> None:
    filt = SearchFilter(
        time_budget_minutes=None,
        group=SearchGroup(adults=1, children=0, child_ages=[]),
    )
    merged = merge_user_preferences(
        filt,
        _prefs(
            constraints=UserConstraints(
                budget_max_pln=0,
                available_minutes=240,
                day_of_week=5,
                window_start="10:00",
                window_end="18:00",
                party=PartyConstraints(adults=2, kids_ages=[6, 9]),
            ),
        ),
    )
    assert merged.time_budget_minutes == 240
    assert merged.group.children == 2
    assert merged.group.child_ages == [6, 9]


def test_merge_outdoor_profile_soft_setting() -> None:
    filt = SearchFilter(setting=SettingPreference.EITHER, setting_strict=False)
    merged = merge_user_preferences(
        filt,
        _prefs(profile=UserProfile(prefer_outdoor=True)),
    )
    assert merged.setting == SettingPreference.OUTDOOR
    assert merged.setting_strict is False


def test_merge_plock_city_scope_sets_city() -> None:
    filt = SearchFilter()
    merged = merge_user_preferences(
        filt,
        _prefs(tourist_geography_scope=TouristGeographyScope.PLOCK_CITY),
    )
    assert merged.city == "Płock"
