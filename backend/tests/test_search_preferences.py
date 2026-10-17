from __future__ import annotations

from backend.api.schemas.plan import PartyConstraints, UserConstraints, UserProfile
from backend.api.schemas.search import (
    PlaceCategory,
    SearchFilter,
    SearchGroup,
    SearchUserPreferences,
    SettingPreference,
)
from backend.services.search_preferences import merge_user_preferences


def _prefs(**kwargs: object) -> SearchUserPreferences:
    return SearchUserPreferences.model_validate(kwargs)


def test_merge_adds_onboarding_interests() -> None:
    filt = SearchFilter(interests=[PlaceCategory.HISTORIA_ZABYTKI])
    merged = merge_user_preferences(
        filt,
        _prefs(interest_tag_ids=["sport_aktywny_wypoczynek", "custom"]),
    )
    values = {item.value for item in merged.interests}
    assert "historia_zabytki" in values
    assert "sport_aktywny_wypoczynek" in values


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
