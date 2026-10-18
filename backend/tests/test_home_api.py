from __future__ import annotations

from datetime import date

import pytest
from httpx import AsyncClient

from backend.db.models import Event


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
    assert names[0] == "Koncert testowy"
    assert len(names) == 2


@pytest.mark.asyncio
async def test_home_upcoming_events_default_limit_four(
    api_client: AsyncClient,
    home_today: date,
) -> None:
    for index in range(6):
        await _event(
            external_id=f"H-L{index}",
            name=f"Wydarzenie {index}",
            start_date=date(2026, 10, 20 + index),
            category="kultura_sztuka_film",
        )

    response = await api_client.post("/api/v1/home/upcoming-events", json={})
    assert response.status_code == 200
    assert len(response.json()["events"]) == 4
