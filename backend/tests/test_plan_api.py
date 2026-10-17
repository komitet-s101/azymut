from __future__ import annotations

from decimal import Decimal

import pytest
from httpx import AsyncClient

from backend.api.schemas.plan import PlanEnrichedResponse
from backend.db.models import OpeningHours, Place, PredefinedRoute, PriceLevel, RouteStop


async def _open_place(
    *,
    name: str = "Muzeum test",
    typical_visit_minutes: int = 60,
) -> Place:
    place = await Place.create(
        name=name,
        city="Sierpc",
        gmina="Sierpc",
        latitude=52.85,
        longitude=19.67,
        category="museum",
        is_indoor=True,
        is_outdoor=False,
        typical_visit_minutes=typical_visit_minutes,
        price_level=PriceLevel.FREE,
        price_max_pln=Decimal("0"),
        family_friendly=4,
        rain_suitable=5,
    )
    await OpeningHours.create(
        place_id=place.id,
        day_of_week=5,
        opens_at="09:00",
        closes_at="18:00",
    )
    return place


def _plan_body(**overrides) -> dict:
    body = {
        "schema_version": 1,
        "persona": "resident",
        "interest_package_id": "family_fun",
        "custom_request": "",
        "constraints": {
            "budget_max_pln": 50,
            "available_minutes": 180,
            "day_of_week": 5,
            "window_start": "10:00",
            "window_end": "16:00",
            "party": {"adults": 2, "kids_ages": [6]},
        },
        "profile": {
            "bmi": None,
            "likes_games": 2,
            "prefer_outdoor": True,
            "gastro_intensity_preference": 2,
            "physical_activity_preference": 3,
        },
        "last_plan_id": None,
    }
    body.update(overrides)
    return body


@pytest.mark.anyio
async def test_plan_stub_resident(api_client: AsyncClient, db) -> None:
    await _open_place(name="Park")
    await _open_place(name="Zoo", typical_visit_minutes=90)

    response = await api_client.post("/api/v1/plan", json=_plan_body())
    assert response.status_code == 200
    data = PlanEnrichedResponse.model_validate(response.json())
    assert data.plan.primary_type == "places"
    assert len(data.plan.steps) >= 1
    assert data.meta is not None
    assert data.meta.planner == "stub"
    for step in data.plan.steps:
        assert str(step.place_id) in data.places


@pytest.mark.anyio
async def test_plan_stub_tourist_route(api_client: AsyncClient, db) -> None:
    a = await _open_place(name="Stop A", typical_visit_minutes=45)
    b = await _open_place(name="Stop B", typical_visit_minutes=45)
    route = await PredefinedRoute.create(
        name="Szlak testowy",
        duration_minutes_approx=120,
        stops_min=2,
        stops_max=2,
        city="Sierpc",
        gmina="Sierpc",
        price_level_max=PriceLevel.FREE,
    )
    await RouteStop.create(route_id=route.id, place_id=a.id, sequence=1, dwell_minutes=45)
    await RouteStop.create(route_id=route.id, place_id=b.id, sequence=2, dwell_minutes=45)

    response = await api_client.post(
        "/api/v1/plan",
        json=_plan_body(persona="tourist", interest_package_id="culture_walk"),
    )
    assert response.status_code == 200
    data = PlanEnrichedResponse.model_validate(response.json())
    assert data.plan.primary_type == "route"
    assert data.plan.route_id == route.id
    assert data.route is not None
    assert data.route.name == "Szlak testowy"


@pytest.mark.anyio
async def test_plan_no_candidates_422(api_client: AsyncClient, db) -> None:
    expensive = await Place.create(
        name="Drogo",
        city="Sierpc",
        gmina="Sierpc",
        latitude=52.85,
        longitude=19.67,
        category="museum",
        is_indoor=True,
        is_outdoor=False,
        typical_visit_minutes=60,
        price_level=PriceLevel.HIGH,
        price_max_pln=Decimal("500"),
    )
    await OpeningHours.create(
        place_id=expensive.id,
        day_of_week=5,
        opens_at="09:00",
        closes_at="18:00",
    )

    response = await api_client.post(
        "/api/v1/plan",
        json=_plan_body(
            constraints={
                "budget_max_pln": 0,
                "available_minutes": 180,
                "day_of_week": 5,
                "window_start": "10:00",
                "window_end": "16:00",
                "party": {"adults": 2, "kids_ages": []},
            }
        ),
    )
    assert response.status_code == 422
