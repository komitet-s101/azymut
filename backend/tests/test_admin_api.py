from __future__ import annotations

from decimal import Decimal

import pytest
from httpx import ASGITransport, AsyncClient

from backend.api.app import create_app
from backend.db.models import Place, PredefinedRoute, PriceLevel
from backend.settings import get_settings


@pytest.mark.anyio
async def test_admin_disabled_returns_404(db, monkeypatch) -> None:
    monkeypatch.setenv("ADMIN_ENABLED", "false")
    get_settings.cache_clear()
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/admin/places")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_admin_create_place_visible_public(api_client: AsyncClient, db) -> None:
    payload = {
        "name": "Admin Test Place",
        "city": "Sierpc",
        "gmina": "Sierpc",
        "latitude": 52.86,
        "longitude": 19.68,
        "category": "cafe",
        "is_indoor": True,
        "is_outdoor": False,
        "typical_visit_minutes": 45,
        "price_level": 1,
        "price_max_pln": "25.00",
    }
    create = await api_client.post("/api/v1/admin/places", json=payload)
    assert create.status_code == 201
    place_id = create.json()["id"]

    public = await api_client.get(f"/api/v1/places/{place_id}")
    assert public.status_code == 200
    assert public.json()["name"] == "Admin Test Place"


@pytest.mark.anyio
async def test_admin_replace_opening_hours(api_client: AsyncClient, db) -> None:
    place = await Place.create(
        name="Hours Test",
        city="Sierpc",
        gmina="Sierpc",
        latitude=52.85,
        longitude=19.67,
        category="museum",
        is_indoor=True,
        is_outdoor=False,
        typical_visit_minutes=60,
        price_level=PriceLevel.FREE,
    )
    hours = [{"day_of_week": 1, "opens_at": "09:00", "closes_at": "17:00"}]
    response = await api_client.put(
        f"/api/v1/admin/places/{place.id}/opening-hours",
        json=hours,
    )
    assert response.status_code == 200
    assert len(response.json()) == 1

    detail = await api_client.get(f"/api/v1/places/{place.id}")
    assert detail.json()["opening_hours"][0]["opens_at"] == "09:00"


@pytest.mark.anyio
async def test_admin_route_stops_order(api_client: AsyncClient, db) -> None:
    p1 = await Place.create(
        name="Stop A",
        city="Sierpc",
        gmina="Sierpc",
        latitude=52.85,
        longitude=19.67,
        category="park",
        is_indoor=False,
        is_outdoor=True,
        typical_visit_minutes=30,
        price_level=PriceLevel.FREE,
    )
    p2 = await Place.create(
        name="Stop B",
        city="Sierpc",
        gmina="Sierpc",
        latitude=52.86,
        longitude=19.68,
        category="park",
        is_indoor=False,
        is_outdoor=True,
        typical_visit_minutes=30,
        price_level=PriceLevel.FREE,
    )
    route = await PredefinedRoute.create(
        name="Test route",
        city="Sierpc",
        gmina="Sierpc",
        duration_minutes_approx=120,
        stops_min=2,
        stops_max=2,
    )
    body = {
        "stops": [
            {"place_id": p2.id, "sequence": 2, "dwell_minutes": 20},
            {"place_id": p1.id, "sequence": 1, "dwell_minutes": 30},
        ]
    }
    response = await api_client.put(
        f"/api/v1/admin/routes/{route.id}/stops",
        json=body,
    )
    assert response.status_code == 200
    stops = response.json()["stops"]
    assert [s["sequence"] for s in stops] == [1, 2]
    assert stops[0]["place"]["name"] == "Stop A"
