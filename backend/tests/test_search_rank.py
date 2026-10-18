from __future__ import annotations

from datetime import date

from backend.api.schemas.search import PlaceCategory, SearchFilter, SearchGroup
from backend.llm.query_parser import parse_search_query_rules
from backend.services.search_preferences import InterestLayers
from backend.services.search_rank import ScoreInput, WeatherBias, rank_matches

TODAY = date(2026, 10, 17)
EXAMPLE = (
    "mam wolne 3 godziny w sobotę, jestem z dwójką dzieci i chcę coś bezpłatnego, "
    "najlepiej na świeżym powietrzu"
)


def _item(
    key: str,
    *,
    category: str,
    family_friendly: int,
    rain_suitable: int,
    activity: int = 0,
    indoor: bool = False,
    outdoor: bool = False,
    price: int | None = 0,
    min_age: int | None = None,
) -> ScoreInput:
    return ScoreInput(
        key=key,
        category=category,
        family_friendly=family_friendly,
        rain_suitable=rain_suitable,
        physical_activity_level=activity,
        is_indoor=indoor,
        is_outdoor=outdoor,
        min_age_recommended=min_age,
        price_level=price,
    )


def test_example_query_rain_changes_the_top_result() -> None:
    filt = parse_search_query_rules(EXAMPLE, today=TODAY)
    park = _item(
        "park",
        category="przyroda_spacery_widoki",
        family_friendly=5,
        rain_suitable=1,
        activity=2,
        outdoor=True,
    )
    museum = _item(
        "muzeum",
        category="kultura_sztuka_film",
        family_friendly=4,
        rain_suitable=5,
        indoor=True,
    )
    sunny = rank_matches([museum, park], filt, WeatherBias(raining=False, used=True))
    rainy = rank_matches([museum, park], filt, WeatherBias(raining=True, used=True))
    assert sunny[0][0].key == "park"
    assert rainy[0][0].key == "muzeum"
    assert sunny[0][0].key != rainy[0][0].key


def test_unknown_free_price_ranks_below_confirmed_free() -> None:
    filt = parse_search_query_rules(EXAMPLE, today=TODAY)
    known = _item(
        "known",
        category="przyroda_spacery_widoki",
        family_friendly=5,
        rain_suitable=1,
        outdoor=True,
        price=0,
    )
    unknown = _item(
        "unknown",
        category="przyroda_spacery_widoki",
        family_friendly=5,
        rain_suitable=1,
        outdoor=True,
        price=None,
    )
    ranked = rank_matches([unknown, known], filt, WeatherBias(raining=False, used=True))
    assert [item.key for item, _score in ranked] == ["known", "unknown"]
    assert ranked[0][1] > ranked[1][1]


def test_sport_interest_promotes_sport_over_family_score() -> None:
    kids = SearchGroup(adults=1, children=2)
    base = dict(group=kids, setting="either")
    without = SearchFilter(**base)
    with_sport = SearchFilter(**base, interests=[PlaceCategory.SPORT_AKTYWNY_WYPOCZYNEK])
    sport = _item(
        "orlik",
        category="sport_aktywny_wypoczynek",
        family_friendly=2,
        rain_suitable=5,
        activity=5,
        indoor=True,
    )
    museum = _item(
        "muzeum",
        category="historia_zabytki",
        family_friendly=5,
        rain_suitable=5,
        indoor=True,
    )
    weather = WeatherBias(raining=False, used=True)
    plain = rank_matches([sport, museum], without, weather)
    sporty = rank_matches([sport, museum], with_sport, weather)
    assert plain[0][0].key == "muzeum"
    assert sporty[0][0].key == "orlik"


def test_outdoor_setting_deprioritizes_indoor_only_sport_from_preferences() -> None:
    filt = SearchFilter(setting="outdoor")
    layers = InterestLayers(
        query=(),
        preference=(PlaceCategory.SPORT_AKTYWNY_WYPOCZYNEK,),
    )
    gym = _item(
        "gym",
        category="sport_aktywny_wypoczynek",
        family_friendly=2,
        rain_suitable=3,
        activity=5,
        indoor=True,
        outdoor=False,
    )
    orlik = _item(
        "orlik",
        category="sport_aktywny_wypoczynek",
        family_friendly=3,
        rain_suitable=2,
        activity=5,
        indoor=False,
        outdoor=True,
    )
    weather = WeatherBias(raining=False, used=True)
    ranked = rank_matches(
        [gym, orlik],
        filt,
        weather,
        interest_layers=layers,
    )
    assert ranked[0][0].key == "orlik"


def test_child_age_penalizes_high_minimum_age() -> None:
    filt = SearchFilter(group=SearchGroup(adults=1, children=1, child_ages=[4]))
    toddler = _item(
        "toddler",
        category="zabawa_gry_adrenalina",
        family_friendly=4,
        rain_suitable=3,
        indoor=True,
        min_age=3,
    )
    teens = _item(
        "teens",
        category="zabawa_gry_adrenalina",
        family_friendly=4,
        rain_suitable=3,
        indoor=True,
        min_age=14,
    )
    ranked = rank_matches([teens, toddler], filt, WeatherBias(raining=False))
    assert ranked[0][0].key == "toddler"
