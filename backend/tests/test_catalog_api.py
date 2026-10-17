from __future__ import annotations

from decimal import Decimal

import pytest
from httpx import AsyncClient

from backend.api.schemas.catalog import PaginatedPlaces, PaginatedRoutes, RouteDetailOut
from backend.api.schemas.interest_packages import InterestPackageOut
from backend.db.models import OpeningHours, Place, PredefinedRoute, PriceLevel, RouteStop


async def _place(
    *,
    name: str = "Place",
    city: str = "Sierpc",
    gmina: str = "Sierpc",
    lat: float = 52.85,
    lon: float = 19.67,
    typical_visit_minutes: int = 60,
    price_level: PriceLevel = PriceLevel.FREE,
    price_max_pln: Decimal | None = Decimal("0"),
) -> Place:
    return await Place.create(
        name=name,
        city=city,
        gmina=gmina,
        latitude=lat,
        longitude=lon,
        category="museum",
        is_indoor=True,
        is_outdoor=False,
        typical_visit_minutes=typical_visit_minutes,
        price_level=price_level,
        price_max_pln=price_max_pln,
    )


@pytest.mark.anyio
async def test_list_places_budget_filter(api_client: AsyncClient, db) -> None:
    cheap = await _place(name="Cheap", price_level=PriceLevel.LOW, price_max_pln=Decimal("20"))
    await _place(
        name="Expensive",
        price_level=PriceLevel.HIGH,
        price_max_pln=Decimal("200"),
    )
    free = await _place(name="Free", price_level=PriceLevel.FREE, price_max_pln=Decimal("0"))

    response = await api_client.get("/api/v1/places", params={"budget_max_pln": 25})
    assert response.status_code == 200
    body = PaginatedPlaces.model_validate(response.json())
    names = {p.name for p in body.items}
    assert "Cheap" in names
    assert "Free" in names
    assert "Expensive" not in names


@pytest.mark.anyio
async def test_list_places_max_visit_minutes(api_client: AsyncClient, db) -> None:
    await _place(name="Short", typical_visit_minutes=30)
    await _place(name="Long", typical_visit_minutes=180)

    response = await api_client.get("/api/v1/places", params={"max_visit_minutes": 45})
    assert response.status_code == 200
    names = {p.name for p in PaginatedPlaces.model_validate(response.json()).items}
    assert names == {"Short"}


@pytest.mark.anyio
async def test_list_places_opening_window(api_client: AsyncClient, db) -> None:
    open_place = await _place(name="OpenNow")
    closed_place = await _place(name="ClosedNow")
    await OpeningHours.create(
        place_id=open_place.id,
        day_of_week=1,
        opens_at="09:00",
        closes_at="18:00",
    )
    await OpeningHours.create(
        place_id=closed_place.id,
        day_of_week=1,
        opens_at="12:00",
        closes_at="14:00",
    )

    response = await api_client.get(
        "/api/v1/places",
        params={
            "day_of_week": 1,
            "window_start": "10:00",
            "window_end": "16:00",
        },
    )
    assert response.status_code == 200
    names = {p.name for p in PaginatedPlaces.model_validate(response.json()).items}
    assert names == {"OpenNow"}


@pytest.mark.anyio
async def test_list_places_city_gmina(api_client: AsyncClient, db) -> None:
    await _place(name="SierpcOnly", city="Sierpc", gmina="Sierpc")
    await _place(name="Other", city="Gostynin", gmina="Gostynin")

    response = await api_client.get("/api/v1/places", params={"city": "Sierpc", "gmina": "Sierpc"})
    assert response.status_code == 200
    names = {p.name for p in PaginatedPlaces.model_validate(response.json()).items}
    assert names == {"SierpcOnly"}


@pytest.mark.anyio
async def test_list_places_geo_sort_and_distance_fields(api_client: AsyncClient, db) -> None:
    await _place(name="Near", lat=52.851, lon=19.671)
    await _place(name="Far", lat=53.5, lon=20.5)

    response = await api_client.get(
        "/api/v1/places",
        params={"lat": 52.85, "lon": 19.67},
    )
    assert response.status_code == 200
    body = PaginatedPlaces.model_validate(response.json())
    assert len(body.items) == 2
    assert body.items[0].name == "Near"
    assert body.items[0].distance_km is not None
    assert body.items[0].distance_label is not None


@pytest.mark.anyio
async def test_list_places_radius_km_filters(api_client: AsyncClient, db) -> None:
    await _place(name="Near", lat=52.851, lon=19.671)
    await _place(name="Far", lat=53.5, lon=20.5)

    with_radius = await api_client.get(
        "/api/v1/places",
        params={"lat": 52.85, "lon": 19.67, "radius_km": 5},
    )
    assert with_radius.status_code == 200
    names_filtered = {p.name for p in PaginatedPlaces.model_validate(with_radius.json()).items}
    assert names_filtered == {"Near"}

    without_radius = await api_client.get(
        "/api/v1/places",
        params={"lat": 52.85, "lon": 19.67},
    )
    assert without_radius.status_code == 200
    names_all = {p.name for p in PaginatedPlaces.model_validate(without_radius.json()).items}
    assert names_all == {"Near", "Far"}


@pytest.mark.anyio
async def test_list_places_lat_without_lon_422(api_client: AsyncClient, db) -> None:
    response = await api_client.get("/api/v1/places", params={"lat": 52.85})
    assert response.status_code == 422


@pytest.mark.anyio
async def test_get_place_404(api_client: AsyncClient, db) -> None:
    response = await api_client.get("/api/v1/places/99999")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_list_routes_max_duration_and_geo(api_client: AsyncClient, db) -> None:
    near = await _place(name="StartNear", lat=52.851, lon=19.671)
    far = await _place(name="StartFar", lat=53.5, lon=20.5)

    short_route = await PredefinedRoute.create(
        name="ShortRoute",
        duration_minutes_approx=60,
        stops_min=1,
        stops_max=1,
        city="Sierpc",
        gmina="Sierpc",
    )
    await RouteStop.create(
        route_id=short_route.id,
        place_id=near.id,
        sequence=1,
        dwell_minutes=30,
    )

    long_route = await PredefinedRoute.create(
        name="LongRoute",
        duration_minutes_approx=240,
        stops_min=1,
        stops_max=1,
        city="Sierpc",
        gmina="Sierpc",
    )
    await RouteStop.create(
        route_id=long_route.id,
        place_id=far.id,
        sequence=1,
        dwell_minutes=60,
    )

    duration_resp = await api_client.get(
        "/api/v1/routes",
        params={"max_duration_minutes": 90},
    )
    assert duration_resp.status_code == 200
    route_names = {r.name for r in PaginatedRoutes.model_validate(duration_resp.json()).items}
    assert route_names == {"ShortRoute"}

    geo_resp = await api_client.get(
        "/api/v1/routes",
        params={"lat": 52.85, "lon": 19.67, "radius_km": 5},
    )
    assert geo_resp.status_code == 200
    geo_body = PaginatedRoutes.model_validate(geo_resp.json())
    assert len(geo_body.items) == 1
    assert geo_body.items[0].name == "ShortRoute"
    assert geo_body.items[0].distance_to_start_km is not None


@pytest.mark.anyio
async def test_route_detail_stops_ordered_by_sequence(api_client: AsyncClient, db) -> None:
    first = await _place(name="FirstStop")
    second = await _place(name="SecondStop")
    route = await PredefinedRoute.create(
        name="OrderedRoute",
        duration_minutes_approx=120,
        stops_min=2,
        stops_max=2,
        city="Sierpc",
        gmina="Sierpc",
    )
    await RouteStop.create(route_id=route.id, place_id=second.id, sequence=2, dwell_minutes=30)
    await RouteStop.create(route_id=route.id, place_id=first.id, sequence=1, dwell_minutes=40)

    response = await api_client.get(f"/api/v1/routes/{route.id}")
    assert response.status_code == 200
    detail = RouteDetailOut.model_validate(response.json())
    assert [s.place.name for s in detail.stops] == ["FirstStop", "SecondStop"]


@pytest.mark.anyio
async def test_get_route_404(api_client: AsyncClient, db) -> None:
    response = await api_client.get("/api/v1/routes/99999")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_interest_packages(api_client: AsyncClient, db) -> None:
    response = await api_client.get("/api/v1/interest-packages")
    assert response.status_code == 200
    packages = InterestPackageOut.parse_list(response.json())
    assert len(packages) >= 1
    assert packages[0].id
    assert packages[0].label_pl
