from __future__ import annotations

from dataclasses import dataclass

from backend.api.schemas.search import (
    PlaceCategory,
    SearchFilter,
    SearchGroup,
    SearchUserPreferences,
    SettingPreference,
    TouristGeographyScope,
)
from backend.llm.query_parser import interests_from_query_text
from backend.services.catalog_query import _price_level_from_budget

_CUSTOM_INTEREST_TAG = "custom"


@dataclass(frozen=True)
class InterestLayers:
    """query = intencja z wypowiedzi; preference = onboarding (miękki ranking)."""

    query: tuple[PlaceCategory, ...] = ()
    preference: tuple[PlaceCategory, ...] = ()


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


def preference_interest_categories(
    prefs: SearchUserPreferences | None,
) -> list[PlaceCategory]:
    if prefs is None:
        return []
    return _tags_to_categories(prefs.interest_tag_ids)


def resolve_interest_layers(
    raw_query: str,
    parsed_interests: list[PlaceCategory],
    prefs: SearchUserPreferences | None,
) -> InterestLayers:
    """Zapytanie ma pierwszeństwo; preferencje uzupełniają tylko brak tematu lub są miękkie."""
    pref_cats = preference_interest_categories(prefs)
    pref_set = set(pref_cats)
    rule_cats = interests_from_query_text(raw_query)

    if rule_cats:
        query = tuple(rule_cats)
    elif parsed_interests:
        stripped = [cat for cat in parsed_interests if cat not in pref_set]
        query = tuple(stripped if stripped else ())
    else:
        query = ()

    if not query and not pref_cats and parsed_interests:
        query = tuple(parsed_interests)

    preference = tuple(cat for cat in pref_cats if cat not in set(query))
    return InterestLayers(query=query, preference=preference)


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
    *,
    apply_profile_setting: bool = True,
) -> SearchFilter:
    if prefs is None:
        return filt

    updates: dict[str, object] = {}
    profile = prefs.profile
    constraints = prefs.constraints

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

    if (
        apply_profile_setting
        and profile is not None
        and filt.setting == SettingPreference.EITHER
    ):
        if profile.prefer_outdoor:
            updates["setting"] = SettingPreference.OUTDOOR
            updates["setting_strict"] = False
        else:
            updates["setting"] = SettingPreference.INDOOR
            updates["setting_strict"] = False

    if (
        prefs.tourist_geography_scope is TouristGeographyScope.PLOCK_CITY
        and filt.city is None
    ):
        updates["city"] = "Płock"

    if not updates:
        return filt
    return filt.model_copy(update=updates)
