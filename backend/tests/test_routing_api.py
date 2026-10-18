from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.fixture
def mock_osrm(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _fake(
        waypoints: list[tuple[float, float]],
        *,
        settings=None,
    ) -> tuple[list[tuple[float, float]], float, float | None]:
        return [(52.55, 19.7), (52.552, 19.705), (52.56, 19.71)], 1.5, 18.0

    monkeypatch.setattr("backend.api.routers.routing.fetch_walking_route", _fake)


async def test_walk_route_returns_road_geometry(
    api_client: AsyncClient,
    mock_osrm: None,
) -> None:
    response = await api_client.post(
        "/api/v1/routing/walk",
        json={
            "waypoints": [
                {"lat": 52.55, "lon": 19.7},
                {"lat": 52.56, "lon": 19.71},
            ],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["distance_km"] == 1.5
    assert body["duration_minutes"] == 18.0
    assert len(body["coordinates"]) == 3
    assert body["coordinates"][0] == [52.55, 19.7]


async def test_walk_route_accepts_up_to_twelve_waypoints(
    api_client: AsyncClient,
    mock_osrm: None,
) -> None:
    waypoints = [{"lat": 52.55 + index * 0.001, "lon": 19.7 + index * 0.001} for index in range(10)]
    response = await api_client.post("/api/v1/routing/walk", json={"waypoints": waypoints})
    assert response.status_code == 200
