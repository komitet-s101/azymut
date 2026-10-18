from __future__ import annotations

import json
from datetime import date

import pytest

from backend.llm.client import LLMUnavailableError
from backend.llm.query_parser import (
    apply_search_defaults,
    coerce_search_filter,
    parse_search_query,
    parse_search_query_rules,
    query_event_intent,
)
from backend.settings import Settings

TODAY = date(2026, 10, 17)


class FakeLLM:
    def __init__(self, responses: list[str | Exception]) -> None:
        self._responses = list(responses)
        self.calls: list[dict[str, object]] = []

    async def chat_completion(self, messages: list[dict[str, str]], **kwargs: object) -> str:
        self.calls.append({"messages": messages, **kwargs})
        if not self._responses:
            raise LLMUnavailableError("no response")
        item = self._responses.pop(0)
        if isinstance(item, Exception):
            raise item
        return item


def _case(
    query: str,
    *,
    minutes: int | None = None,
    dow: int | None = None,
    when: date | None = None,
    adults: int = 1,
    children: int = 0,
    ages: list[int] | None = None,
    max_price: int | None = None,
    price_strict: bool = False,
    setting: str = "either",
    setting_strict: bool = False,
    interests: list[str] | None = None,
    city: str | None = None,
) -> dict[str, object]:
    return {
        "query": query,
        "minutes": minutes,
        "dow": dow,
        "when": when,
        "adults": adults,
        "children": children,
        "ages": ages or [],
        "max_price": max_price,
        "price_strict": price_strict,
        "setting": setting,
        "setting_strict": setting_strict,
        "interests": interests or [],
        "city": city,
    }


POLISH_QUERIES = [
    _case(
        "mam wolne 3 godziny w sobotę, jestem z dwójką dzieci i chcę coś bezpłatnego, najlepiej na świeżym powietrzu",
        minutes=180,
        dow=5,
        when=TODAY,
        children=2,
        max_price=0,
        price_strict=True,
        setting="outdoor",
    ),
    _case(
        "szukam darmowej atrakcji dla dzieci w plocku na niedziele",
        dow=6,
        when=date(2026, 10, 18),
        children=2,
        max_price=0,
        price_strict=True,
        city="Płock",
    ),
    _case(
        "cos w domu jak pada, 2h, bez dzieci",
        minutes=120,
        setting="indoor",
    ),
    _case(
        "chce isc na basen w piatek z zona",
        dow=4,
        when=date(2026, 10, 23),
        adults=2,
        interests=["sport_aktywny_wypoczynek"],
    ),
    _case(
        "restauracja na dzis wieczorem, budzet do 80 zl, dwie osoby",
        dow=5,
        when=TODAY,
        adults=2,
        max_price=2,
        price_strict=True,
        interests=["jedzenie_lokalne_smaki"],
    ),
    _case(
        "spacer po plocku z wozkiem, najlepiej za darmo",
        children=1,
        ages=[1],
        max_price=0,
        setting="outdoor",
        interests=["przyroda_spacery_widoki"],
        city="Płock",
    ),
    _case(
        "muzeum w sobote, max 90 minut, dorosli",
        minutes=90,
        dow=5,
        when=TODAY,
        interests=["historia_zabytki"],
    ),
    _case(
        "kino z dzieckiem 8 lat w niedziele",
        dow=6,
        when=date(2026, 10, 18),
        children=1,
        ages=[8],
        interests=["kultura_sztuka_film"],
    ),
    _case(
        "boisko albo orlik, sport, 1 godzina",
        minutes=60,
        interests=["sport_aktywny_wypoczynek"],
    ),
    _case(
        "cos na swiezym powietrzu w wyszogrodzie",
        setting="outdoor",
        city="Wyszogród",
    ),
    _case(
        "festiwal albo koncert w ten weekend",
        dow=5,
        when=TODAY,
        interests=["muzyka_widowiska", "festiwale_lokalne_swieta"],
    ),
    _case(
        "sauna tylko dla doroslych, w srode",
        dow=2,
        when=date(2026, 10, 21),
        interests=["relaks_wypoczynek"],
    ),
    _case(
        "tanie jedzenie po pracy w plocku",
        max_price=1,
        interests=["jedzenie_lokalne_smaki"],
        city="Płock",
    ),
    _case(
        "park linowy dla 5-latka, pogodnie",
        children=1,
        ages=[5],
        interests=["zabawa_gry_adrenalina"],
    ),
    _case(
        "nie chce placic, 4 godziny, dwojka dzieci 4 i 7 lat, plac zabaw",
        minutes=240,
        children=2,
        ages=[4, 7],
        max_price=0,
        price_strict=True,
        interests=["zabawa_gry_adrenalina"],
    ),
    _case(
        "wycieczka do zoo jutro",
        dow=6,
        when=date(2026, 10, 18),
        interests=["przyroda_spacery_widoki"],
    ),
    _case(
        "cos pod dachem bo bedzie deszcz, rodzinnie",
        children=1,
        setting="indoor",
    ),
    _case(
        "historia i zabytki, spokojnie, bez pospiechu, 2 osoby",
        adults=2,
        interests=["historia_zabytki"],
    ),
    _case(
        "mecz w sobote",
        dow=5,
        when=TODAY,
        interests=["kibicowanie_wydarzenia_sportowe"],
    ),
    _case(
        "warsztaty ceramiczne dla dzieci w gostyninie",
        children=2,
        interests=["warsztaty_nauka_pasje"],
        city="Gostynin",
    ),
]


def _assert_case(filt, case: dict[str, object]) -> None:
    assert filt.time_budget_minutes == case["minutes"]
    assert filt.day_of_week == case["dow"]
    assert filt.date == case["when"]
    assert filt.group.adults == case["adults"]
    assert filt.group.children == case["children"]
    assert filt.group.child_ages == case["ages"]
    assert filt.max_price_level == case["max_price"]
    assert filt.price_strict == case["price_strict"]
    assert filt.setting.value == case["setting"]
    assert filt.setting_strict == case["setting_strict"]
    assert [item.value for item in filt.interests] == case["interests"]
    expected_city = case["city"] if case["city"] is not None else "Płock"
    assert filt.city == expected_city


def _llm_json(case: dict[str, object]) -> str:
    when = case["when"]
    return json.dumps(
        {
            "date": when.isoformat() if isinstance(when, date) else None,
            "day_of_week": case["dow"],
            "time_budget_minutes": case["minutes"],
            "adults": case["adults"],
            "children": case["children"],
            "child_ages": case["ages"],
            "max_price_level": case["max_price"],
            "price_strict": case["price_strict"],
            "setting": case["setting"],
            "setting_strict": case["setting_strict"],
            "interests": case["interests"],
            "city": case["city"],
        },
        ensure_ascii=False,
    )


def test_polish_query_catalog_has_twenty_examples() -> None:
    assert len(POLISH_QUERIES) >= 20


@pytest.mark.parametrize("case", POLISH_QUERIES, ids=lambda case: case["query"][:48])
def test_rules_parse_polish_queries(case: dict[str, object]) -> None:
    filt = parse_search_query_rules(str(case["query"]), today=TODAY)
    _assert_case(filt, case)


@pytest.mark.anyio
@pytest.mark.parametrize("case", POLISH_QUERIES, ids=lambda case: case["query"][:48])
async def test_parser_uses_mocked_llm_for_polish_queries(case: dict[str, object]) -> None:
    client = FakeLLM([_llm_json(case)])
    parsed = await parse_search_query(
        str(case["query"]),
        today=TODAY,
        client=client,  # type: ignore[arg-type]
    )
    assert parsed.source == "llm"
    _assert_case(parsed.filter, case)
    assert client.calls
    messages = client.calls[0]["messages"]
    assert isinstance(messages, list)
    assert str(case["query"]) in messages[-1]["content"]
    assert client.calls[0]["json_schema"] is not None


@pytest.mark.anyio
async def test_parser_retries_once_then_accepts_json() -> None:
    valid = _llm_json(POLISH_QUERIES[0])
    client = FakeLLM(["to nie jest json", valid])
    parsed = await parse_search_query(
        str(POLISH_QUERIES[0]["query"]),
        today=TODAY,
        client=client,  # type: ignore[arg-type]
    )
    assert parsed.source == "llm"
    assert len(client.calls) == 2
    assert client.calls[1]["json_schema"] is None
    _assert_case(parsed.filter, POLISH_QUERIES[0])


@pytest.mark.anyio
async def test_parser_falls_back_to_rules_when_llm_stays_invalid() -> None:
    client = FakeLLM(["nie", "tez nie"])
    parsed = await parse_search_query(
        str(POLISH_QUERIES[0]["query"]),
        today=TODAY,
        client=client,  # type: ignore[arg-type]
    )
    assert parsed.source == "rules"
    _assert_case(parsed.filter, POLISH_QUERIES[0])


@pytest.mark.anyio
async def test_parser_falls_back_when_llm_is_down() -> None:
    client = FakeLLM([LLMUnavailableError("timeout")])
    parsed = await parse_search_query(
        "mecz w sobote",
        today=TODAY,
        client=client,  # type: ignore[arg-type]
        settings=Settings(groq_api_key="present", _env_file=None),
    )
    assert parsed.source == "rules"
    assert parsed.filter.interests[0].value == "kibicowanie_wydarzenia_sportowe"
    assert parsed.filter.day_of_week == 5


@pytest.mark.anyio
async def test_parser_skips_llm_without_api_key() -> None:
    parsed = await parse_search_query(
        str(POLISH_QUERIES[0]["query"]),
        today=TODAY,
        settings=Settings(groq_api_key="", llm_api_key="", _env_file=None),
    )
    assert parsed.source == "rules"
    _assert_case(parsed.filter, POLISH_QUERIES[0])


def test_default_city_plock_when_unspecified() -> None:
    filt = parse_search_query_rules("muzeum i spacer", today=TODAY)
    assert filt.city == "Płock"


def test_stop_count_from_numeric_phrase() -> None:
    filt = parse_search_query_rules("3 miejsca na spacer w Płocku", today=TODAY)
    assert filt.stop_count == 3


def test_stop_count_ignores_hours_phrase() -> None:
    filt = parse_search_query_rules("mam 3 godziny wolnego", today=TODAY)
    assert filt.stop_count is None
    assert filt.time_budget_minutes == 180


def test_cinema_query_sets_today_for_event_calendar() -> None:
    filt = parse_search_query_rules("kino w Płocku", today=TODAY)
    assert filt.date == TODAY
    assert filt.day_of_week == TODAY.weekday()
    assert query_event_intent("kino w Płocku", filt) is True


def test_museum_query_does_not_force_event_date() -> None:
    filt = parse_search_query_rules("muzeum w Płocku", today=TODAY)
    assert filt.date is None
    assert query_event_intent("muzeum w Płocku", filt) is False


def test_apply_search_defaults_after_llm_without_date() -> None:
    base = coerce_search_filter(
        {
            "date": None,
            "day_of_week": None,
            "time_budget_minutes": None,
            "adults": 1,
            "children": 0,
            "child_ages": [],
            "max_price_level": None,
            "price_strict": False,
            "setting": "either",
            "setting_strict": False,
            "interests": ["muzyka_widowiska"],
            "city": "Płock",
        },
        today=TODAY,
    )
    updated = apply_search_defaults(base, "koncert w Płocku", TODAY)
    assert updated.date == TODAY


def test_coerce_messy_llm_payload() -> None:
    filt = coerce_search_filter(
        {
            "day_of_week": "sobota",
            "time_budget_minutes": "180",
            "children": "2",
            "adults": "1",
            "child_ages": ["4", "7"],
            "max_price_level": "bezplatne",
            "price_strict": "tak",
            "setting": "na zewnątrz",
            "setting_strict": "nie",
            "interests": ["sport", "nie_ma_takiej", "historia_zabytki"],
            "city": "plocku",
            "places": ["to nie filtr"],
        },
        today=TODAY,
    )
    assert filt.date == TODAY
    assert filt.day_of_week == 5
    assert filt.time_budget_minutes == 180
    assert filt.group.children == 2
    assert filt.group.child_ages == [4, 7]
    assert filt.max_price_level == 0
    assert filt.price_strict is True
    assert filt.setting.value == "outdoor"
    assert filt.setting_strict is False
    assert [item.value for item in filt.interests] == [
        "sport_aktywny_wypoczynek",
        "historia_zabytki",
    ]
    assert filt.city == "Płock"
