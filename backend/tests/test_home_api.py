from __future__ import annotations

from datetime import date

import pytest
from httpx import AsyncClient

from backend.db.models import Event, Place, PriceLevel


async def _event(
    *,
    external_id: str,
    name: str,
    start_date: date,
    category: str | None,
    start_time: str = "18:00",
) -> Event:
    return await Event.create(
        external_id=external_id,
        name=name,
        start_date=start_date,
        start_time=start_time,
        category=category,
        city="Płock",
        status="upcoming",
    )


@pytest.fixture
def home_today(monkeypatch: pytest.MonkeyPatch) -> date:
    fixed = date(2026, 10, 17)
    monkeypatch.setattr(
        "backend.services.upcoming_events.warsaw_today",
        lambda: fixed,
    )
    return fixed


@pytest.mark.asyncio
async def test_home_upcoming_events_respects_interests(
    api_client: AsyncClient,
    home_today: date,
) -> None:
    await _event(
        external_id="H-E1",
        name="Koncert testowy",
        start_date=date(2026, 10, 18),
        category="muzyka_widowiska",
    )
    await _event(
        external_id="H-E2",
        name="Kino testowe",
        start_date=date(2026, 10, 18),
        category="kultura_sztuka_film",
    )
    await _event(
        external_id="H-E3",
        name="Mecz testowy",
        start_date=date(2026, 10, 19),
        category="kibicowanie_wydarzenia_sportowe",
    )

    response = await api_client.post(
        "/api/v1/home/upcoming-events",
        json={
            "limit": 2,
            "user_preferences": {"interest_tag_ids": ["muzyka_widowiska"]},
        },
    )
    assert response.status_code == 200
    payload = response.json()
    names = [item["name"] for item in payload["events"]]
    assert names == ["Koncert testowy"]


@pytest.mark.asyncio
async def test_home_upcoming_events_without_interests_returns_empty(
    api_client: AsyncClient,
    home_today: date,
) -> None:
    await _event(
        external_id="H-K1",
        name="Mecz bez preferencji",
        start_date=date(2026, 10, 18),
        category="kibicowanie_wydarzenia_sportowe",
    )

    response = await api_client.post("/api/v1/home/upcoming-events", json={})
    assert response.status_code == 200
    assert response.json()["events"] == []


@pytest.mark.asyncio
async def test_home_upcoming_events_excludes_unselected_categories(
    api_client: AsyncClient,
    home_today: date,
) -> None:
    await _event(
        external_id="H-K2",
        name="Mecz testowy",
        start_date=date(2026, 10, 18),
        category="kibicowanie_wydarzenia_sportowe",
    )
    await _event(
        external_id="H-K3",
        name="Koncert testowy",
        start_date=date(2026, 10, 19),
        category="muzyka_widowiska",
    )

    response = await api_client.post(
        "/api/v1/home/upcoming-events",
        json={
            "limit": 4,
            "user_preferences": {"interest_tag_ids": ["muzyka_widowiska"]},
        },
    )
    assert response.status_code == 200
    names = [item["name"] for item in response.json()["events"]]
    assert names == ["Koncert testowy"]


@pytest.mark.asyncio
async def test_home_recommended_places_respects_interests(
    api_client: AsyncClient,
) -> None:
    await Place.create(
        name="Muzeum testowe",
        city="Płock",
        gmina="Płock",
        category="historia_zabytki",
        is_indoor=True,
        is_outdoor=False,
        typical_visit_minutes=60,
        price_level=PriceLevel.LOW,
    )
    await Place.create(
        name="Basen testowy",
        city="Płock",
        gmina="Płock",
        category="sport_aktywny_wypoczynek",
        is_indoor=True,
        is_outdoor=False,
        typical_visit_minutes=90,
        price_level=PriceLevel.MEDIUM,
    )

    response = await api_client.post(
        "/api/v1/home/recommended-places",
        json={
            "limit": 3,
            "user_preferences": {"interest_tag_ids": ["historia_zabytki"]},
        },
    )
    assert response.status_code == 200
    names = [item["name"] for item in response.json()["places"]]
    assert names[0] == "Muzeum testowe"
    assert "Basen testowy" not in names