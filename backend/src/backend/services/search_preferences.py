from __future__ import annotations

from backend.api.schemas.search import (
    PlaceCategory,
    SearchFilter,
    SearchGroup,
    SearchUserPreferences,
    SettingPreference,
)
from backend.services.catalog_query import _price_level_from_budget

_CUSTOM_INTEREST_TAG = "custom"


def _tags_to_categories(tag_ids: list[str]) -> list[PlaceCategory]:
    found: list[PlaceCategory] = []
    for tag in tag_ids:
        if tag == _CUSTOM_INTEREST_TAG:
            continue
        try:
            category = PlaceCategory(tag)
        except ValueError:
            continue
        if category not in found:
            found.append(category)
    return found


def preferences_query_suffix(prefs: SearchUserPreferences | None) -> str:
    if prefs is None:
        return ""
    lines = ["Preferencje z onboardingu:"]
    if prefs.interest_tag_ids:
        lines.append(f"- wybrane kategorie: {', '.join(prefs.interest_tag_ids)}")
    if prefs.persona:
        lines.append(f"- persona: {prefs.persona}")
    if prefs.profile is not None:
        lines.append(
            f"- profil: outdoor={prefs.profile.prefer_outdoor}, "
            f"aktywność={prefs.profile.physical_activity_preference}/5, "
            f"gry={prefs.profile.likes_games}/5, "
            f"gastro={prefs.profile.gastro_intensity_preference}/5"
        )
    if prefs.constraints is not None:
        party = prefs.constraints.party
        lines.append(
            f"- czas: {prefs.constraints.available_minutes} min, "
            f"dorośli={party.adults}, dzieci (wiek): {party.kids_ages or 'brak'}"
        )
    if len(lines) <= 1:
        return ""
    return "\n\n" + "\n".join(lines)


def merge_user_preferences(
    filt: SearchFilter,
    prefs: SearchUserPreferences | None,
) -> SearchFilter:
    if prefs is None:
        return filt

    updates: dict[str, object] = {}
    profile = prefs.profile
    constraints = prefs.constraints

    tag_categories = _tags_to_categories(prefs.interest_tag_ids)
    if tag_categories:
        merged_interests = list(filt.interests)
        for category in tag_categories:
            if category not in merged_interests:
                merged_interests.append(category)
        updates["interests"] = merged_interests

    if constraints is not None:
        if filt.time_budget_minutes is None and constraints.available_minutes > 0:
            updates["time_budget_minutes"] = constraints.available_minutes

        party = constraints.party
        kids_ages = [age for age in party.kids_ages if 0 <= age <= 17]
        if kids_ages and filt.group.children == 0 and not filt.group.child_ages:
            updates["group"] = SearchGroup(
                adults=max(filt.group.adults, party.adults),
                children=len(kids_ages),
                child_ages=kids_ages,
            )

        if (
            filt.max_price_level is None
            and not filt.price_strict
            and constraints.budget_max_pln > 0
        ):
            level = _price_level_from_budget(constraints.budget_max_pln)
            if level is not None:
                updates["max_price_level"] = int(level)

    if profile is not None and filt.setting == SettingPreference.EITHER:
        if profile.prefer_outdoor:
            updates["setting"] = SettingPreference.OUTDOOR
            updates["setting_strict"] = False
        else:
            updates["setting"] = SettingPreference.INDOOR
            updates["setting_strict"] = False

    if not updates:
        return filt
    return filt.model_copy(update=updates)
