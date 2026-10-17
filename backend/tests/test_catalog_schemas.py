from __future__ import annotations

from decimal import Decimal

import pytest
from httpx import AsyncClient

from backend.api.schemas.catalog import (
    OpeningHoursOut,
    PlaceDetailOut,
    PlaceOut,
    RouteDetailOut,
    RouteStopOut,
    place_to_out,
)
from backend.db.models import OpeningHours, Place, PredefinedRoute, PriceLevel, RouteStop


@pytest.mark.anyio
async def test_place_out_from_orm(db) -> None:
    place = await Place.create(
        name="Test Place",
        city="Sierpc",
        gmina="Sierpc",
        latitude=52.85,
        longitude=19.67,
        category="museum",
        is_indoor=True,
        is_outdoor=False,
        typical_visit_minutes=60,
        price_level=PriceLevel.FREE,
        price_max_pln=Decimal("0"),
    )
    out = place_to_out(place, distance_km=1.234)
    assert isinstance(out, PlaceOut)
    assert out.id == place.id
    assert out.name == "Test Place"
    assert out.distance_km == 1.23
    assert out.distance_label is not None


@pytest.mark.anyio
async def test_opening_hours_out_excludes_id(db) -> None:
    place = await Place.create(
        name="Hours Place",
        city="Sierpc",
        gmina="Sierpc",
        latitude=52.85,
        longitude=19.67,
        category="museum",
        is_indoor=True,
        is_outdoor=False,
        typical_visit_minutes=30,
        price_level=PriceLevel.FREE,
    )
    hours = await OpeningHours.create(
        place_id=place.id,
        day_of_week=1,
        opens_at="09:00",
        closes_at="17:00",
    )
    out = OpeningHoursOut.model_validate(hours)
    dumped = out.model_dump()
    assert set(dumped.keys()) == {"day_of_week", "opens_at", "closes_at"}


@pytest.mark.anyio
async def test_route_stop_out_place_summary(db) -> None:
    place = await Place.create(
        name="Stop Place",
        city="Sierpc",
        gmina="Sierpc",
        latitude=52.85,
        longitude=19.67,
        category="attraction",
        is_indoor=False,
        is_outdoor=True,
        typical_visit_minutes=45,
        price_level=PriceLevel.FREE,
        family_friendly=4,
    )
    route = await PredefinedRoute.create(
        name="Test Route",
        duration_minutes_approx=120,
        stops_min=1,
        stops_max=3,
        city="Sierpc",
        gmina="Sierpc",
    )
    stop = await RouteStop.create(
        route_id=route.id,
        place_id=place.id,
        sequence=1,
        dwell_minutes=30,
    )
    await stop.fetch_related("place")
    out = RouteStopOut.model_validate(stop)
    assert out.sequence == 1
    assert out.place.id == place.id
    assert out.place.name == "Stop Place"
    assert "city" not in out.place.model_dump()


@pytest.mark.anyio
async def test_catalog_api_place_detail(api_client: AsyncClient, db) -> None:
    place = await Place.create(
        name="API Detail",
        city="Sierpc",
        gmina="Sierpc",
        latitude=52.85,
        longitude=19.67,
        category="museum",
        is_indoor=True,
        is_outdoor=False,
        typical_visit_minutes=60,
        price_level=PriceLevel.LOW,
    )
    await OpeningHours.create(
        place_id=place.id,
        day_of_week=0,
        opens_at="10:00",
        closes_at="16:00",
    )
    response = await api_client.get(f"/api/v1/places/{place.id}")
    assert response.status_code == 200
    detail = PlaceDetailOut.model_validate(response.json())
    assert detail.name == "API Detail"
    assert len(detail.opening_hours) == 1
    assert detail.opening_hours[0].opens_at == "10:00"


@pytest.mark.anyio
async def test_catalog_api_route_detail(api_client: AsyncClient, db) -> None:
    place = await Place.create(
        name="Route Stop",
        city="Gostynin",
        gmina="Gostynin",
        latitude=52.43,
        longitude=19.46,
        category="attraction",
        is_indoor=False,
        is_outdoor=True,
        typical_visit_minutes=40,
        price_level=PriceLevel.FREE,
    )
    route = await PredefinedRoute.create(
        name="API Route",
        duration_minutes_approx=90,
        stops_min=1,
        stops_max=1,
        city="Gostynin",
        gmina="Gostynin",
    )
    await RouteStop.create(
        route_id=route.id,
        place_id=place.id,
        sequence=1,
        dwell_minutes=40,
    )
    response = await api_client.get(f"/api/v1/routes/{route.id}")
    assert response.status_code == 200
    detail = RouteDetailOut.model_validate(response.json())
    assert detail.name == "API Route"
    assert len(detail.stops) == 1
    assert detail.stops[0].place.name == "Route Stop"
