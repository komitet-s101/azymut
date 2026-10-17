from __future__ import annotations

from datetime import date, datetime
from zoneinfo import ZoneInfo

import pytest
from httpx import AsyncClient

from backend.api.schemas.search import SearchResult
from backend.api.schemas.weather import (
    ForecastHour,
    WeatherCondition,
    WeatherForecast,
    WeatherSnapshot,
)
from backend.db.models import Event, OpeningHours, Place, PriceLevel
from backend.llm.query_parser import parse_search_query_rules
from backend.services.search import explain_results, warsaw_today
from backend.weather.rules import compute_is_outdoor_friendly

WARSAW = ZoneInfo("Europe/Warsaw")
SATURDAY = date(2026, 10, 17)
EXAMPLE = (
    "mam wolne 3 godziny w sobotę, jestem z dwójką dzieci i chcę coś bezpłatnego, "
    "najlepiej na świeżym powietrzu"
)


class _Clock:
    async def get_current(self, lat: float, lon: float) -> WeatherSnapshot:
        return _snapshot(self.raining, lat, lon)

    async def get_forecast(self, lat: float, lon: float, hours: int = 24) -> WeatherForecast:
        start = datetime(2026, 10, 17, 11, tzinfo=WARSAW)
        condition = WeatherCondition.RAIN if self.raining else WeatherCondition.CLEAR
        precip = 2.0 if self.raining else 0.0
        slot = ForecastHour(
            start=start,
            end=start.replace(hour=12),
            condition=condition,
            precipitation_mm_h=precip,
            is_outdoor_friendly=compute_is_outdoor_friendly(
                condition=condition,
                precipitation_mm_h=precip,
            ),
        )
        return WeatherForecast(lat=lat, lon=lon, hours=[slot], provider="test")

    def __init__(self, raining: bool) -> None:
        self.raining = raining


def _snapshot(raining: bool, lat: float, lon: float) -> WeatherSnapshot:
    condition = WeatherCondition.RAIN if raining else WeatherCondition.CLEAR
    precip = 2.0 if raining else 0.0
    return WeatherSnapshot(
        lat=lat,
        lon=lon,
        observed_at=datetime(2026, 10, 17, 11, tzinfo=WARSAW),
        condition=condition,
        temperature_c=12.0 if raining else 18.0,
        precipitation_mm_h=precip,
        wind_speed_ms=3.0,
        is_outdoor_friendly=compute_is_outdoor_friendly(
            condition=condition,
            precipitation_mm_h=precip,
        ),
        provider="test",
    )


async def _place(**kwargs: object) -> Place:
    data = {
        "city": "Płock",
        "gmina": "Płock",
        "latitude": 52.55,
        "longitude": 19.7,
        "is_indoor": False,
        "is_outdoor": True,
        "adult_only": False,
        "typical_visit_minutes": 60,
        "price_level": PriceLevel.FREE,
        "family_friendly": 4,
        "rain_suitable": 1,
        "physical_activity_level": 1,
    }
    data.update(kwargs)
    return await Place.create(**data)


@pytest.fixture
def fixed_saturday(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr("backend.services.search.warsaw_today", lambda: SATURDAY)


@pytest.fixture
def weather(monkeypatch: pytest.MonkeyPatch):
    state = {"raining": False}

    def _service() -> _Clock:
        return _Clock(state["raining"])

    monkeypatch.setattr("backend.services.search.get_weather_service", _service)
    return state


async def _seed_catalog() -> None:
    await _place(
        name="Bulwary Wisły",
        category="przyroda_spacery_widoki",
        family_friendly=5,
        rain_suitable=1,
        is_indoor=False,
        is_outdoor=True,
        physical_activity_level=2,
    )
    museum = await _place(
        name="Muzeum Mazowieckie",
        category="kultura_sztuka_film",
        family_friendly=4,
        rain_suitable=5,
        is_indoor=True,
        is_outdoor=False,
        physical_activity_level=0,
    )
    await OpeningHours.create(
        place_id=museum.id,
        day_of_week=5,
        opens_at="10:00",
        closes_at="16:00",
    )
    await _place(
        name="Skwer bez cennika",
        category="przyroda_spacery_widoki",
        family_friendly=5,
        rain_suitable=1,
        is_indoor=False,
        is_outdoor=True,
        price_level=None,
    )
    await _place(
        name="Basen płatny",
        category="sport_aktywny_wypoczynek",
        price_level=PriceLevel.MEDIUM,
        family_friendly=5,
        rain_suitable=5,
        is_indoor=True,
        is_outdoor=False,
        physical_activity_level=5,
    )
    await _place(
        name="SPA 18+",
        category="relaks_wypoczynek",
        adult_only=True,
        price_level=PriceLevel.FREE,
        family_friendly=0,
        rain_suitable=5,
        is_indoor=True,
        is_outdoor=False,
    )
    await _place(
        name="Całodniowa wycieczka",
        category="przyroda_spacery_widoki",
        typical_visit_minutes=400,
        family_friendly=5,
    )
    cafe = await _place(
        name="Kawiarnia poniedziałkowa",
        category="jedzenie_lokalne_smaki",
        is_indoor=True,
        is_outdoor=False,
        rain_suitable=5,
        family_friendly=3,
    )
    await OpeningHours.create(
        place_id=cafe.id,
        day_of_week=0,
        opens_at="08:00",
        closes_at="18:00",
    )
    await Event.create(
        external_id="E-SAT-FREE",
        name="Koncert na rynku",
        city="Płock",
        start_date=SATURDAY,
        start_time="16:00",
        category="muzyka_widowiska",
        is_free=True,
        price_level=PriceLevel.FREE,
    )
    await Event.create(
        external_id="E-SUN",
        name="Jarmark niedzielny",
        city="Płock",
        start_date=date(2026, 10, 18),
        category="festiwale_lokalne_swieta",
        is_free=True,
    )
    await Event.create(
        external_id="E-SAT-PAID",
        name="Mecz ligowy",
        city="Płock",
        start_date=SATURDAY,
        category="kibicowanie_wydarzenia_sportowe",
        is_free=False,
        price_level=PriceLevel.HIGH,
    )


@pytest.mark.anyio
async def test_search_endpoint_filters_and_reranks_for_weather(
    api_client: AsyncClient,
    db,
    fixed_saturday,
    weather: dict[str, bool],
) -> None:
    await _seed_catalog()
    weather["raining"] = False
    sunny = await api_client.post("/api/v1/search", json={"query": EXAMPLE})
    assert sunny.status_code == 200
    sunny_body = sunny.json()
    assert sunny_body["parser"] == "rules"
    assert sunny_body["filter"]["time_budget_minutes"] == 180
    assert sunny_body["filter"]["group"]["children"] == 2
    assert sunny_body["filter"]["price_strict"] is True
    assert sunny_body["filter"]["max_price_level"] == 0
    assert sunny_body["filter"]["setting"] == "outdoor"
    assert sunny_body["filter"]["setting_strict"] is False
    assert sunny_body["weather_raining"] is False
    sunny_names = [item["name"] for item in sunny_body["results"]]
    assert sunny_names[0] == "Bulwary Wisły"
    assert "Basen płatny" not in sunny_names
    assert "SPA 18+" not in sunny_names
    assert "Całodniowa wycieczka" not in sunny_names
    assert "Kawiarnia poniedziałkowa" not in sunny_names
    assert "Jarmark niedzielny" not in sunny_names
    assert "Mecz ligowy" not in sunny_names
    assert "Koncert na rynku" in sunny_names
    assert "Muzeum Mazowieckie" in sunny_names
    skwer = next(item for item in sunny_body["results"] if item["name"] == "Skwer bez cennika")
    assert "price_unconfirmed" in skwer["flags"]
    assert "check_hours" in skwer["flags"]
    bulwary = next(item for item in sunny_body["results"] if item["name"] == "Bulwary Wisły")
    assert "check_hours" in bulwary["flags"]
    assert skwer["score"] < bulwary["score"]
    museum = next(item for item in sunny_body["results"] if item["name"] == "Muzeum Mazowieckie")
    assert "check_hours" not in museum["flags"]

    weather["raining"] = True
    rainy = await api_client.post("/api/v1/search", json={"query": EXAMPLE})
    assert rainy.status_code == 200
    rainy_body = rainy.json()
    assert rainy_body["weather_raining"] is True
    assert rainy_body["results"][0]["name"] == "Muzeum Mazowieckie"
    assert rainy_body["results"][0]["name"] != sunny_names[0]


@pytest.mark.anyio
async def test_search_includes_events_for_concert_query_without_date(
    api_client: AsyncClient,
    db,
    fixed_saturday,
) -> None:
    await _seed_catalog()
    response = await api_client.post("/api/v1/search", json={"query": "koncert w Płocku"})
    assert response.status_code == 200
    body = response.json()
    assert body["filter"]["date"] == SATURDAY.isoformat()
    kinds = {item["kind"] for item in body["results"]}
    assert "event" in kinds
    names = [item["name"] for item in body["results"] if item["kind"] == "event"]
    assert "Koncert na rynku" in names


@pytest.mark.anyio
async def test_koncert_query_lists_events_before_concert_halls(
    api_client: AsyncClient,
    db,
    fixed_saturday,
) -> None:
    await _seed_catalog()
    response = await api_client.post("/api/v1/search", json={"query": "koncert"})
    assert response.status_code == 200
    body = response.json()
    assert body["results"][0]["kind"] == "event"
    assert body["results"][0]["name"] == "Koncert na rynku"


@pytest.mark.anyio
async def test_search_rejects_blank_query(api_client: AsyncClient, db) -> None:
    response = await api_client.post("/api/v1/search", json={"query": " "})
    assert response.status_code == 422


@pytest.mark.anyio
async def test_explain_results_keeps_only_known_ids() -> None:
    results = [
        SearchResult(kind="place", id=4, name="Bulwary", score=3, category="przyroda_spacery_widoki"),
        SearchResult(kind="event", id=9, name="Koncert", score=1),
    ]

    class _Reasons:
        async def chat_completion(self, messages: list[dict[str, str]], **kwargs: object) -> str:
            return (
                '{"items": ['
                '{"kind": "place", "id": 4, "reason": "Bezpłatny spacer przy Wiśle."},'
                '{"kind": "place", "id": 99, "reason": "Nie ma takiego miejsca."}'
                "]}"
            )

    await explain_results(
        results,
        query=EXAMPLE,
        filt=parse_search_query_rules(EXAMPLE, today=SATURDAY),
        client=_Reasons(),  # type: ignore[arg-type]
    )
    assert results[0].reason == "Bezpłatny spacer przy Wiśle."
    assert results[1].reason is None


def test_warsaw_today_is_a_date() -> None:
    assert isinstance(warsaw_today(), date)
