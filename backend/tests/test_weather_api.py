from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from backend.db.models import Place, PriceLevel
from backend.weather.stub import StubWeatherProvider


async def _place_sierpc() -> Place:
    return await Place.create(
        name="Centrum",
        city="Sierpc",
        gmina="Sierpc",
        latitude=52.85,
        longitude=19.67,
        category="park",
        is_indoor=False,
        is_outdoor=True,
        typical_visit_minutes=60,
        price_level=PriceLevel.FREE,
    )


@pytest.mark.anyio
async def test_weather_current_stub_coords(api_client: AsyncClient, db) -> None:
    response = await api_client.get(
        "/api/v1/weather/current",
        params={"lat": 52.85, "lon": 19.67},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "stub"
    assert body["is_outdoor_friendly"] is True
    assert body["temperature_c"] == 18.0


@pytest.mark.anyio
async def test_weather_current_by_city(api_client: AsyncClient, db) -> None:
    await _place_sierpc()
    response = await api_client.get(
        "/api/v1/weather/current",
        params={"city": "Sierpc"},
    )
    assert response.status_code == 200
    assert response.json()["lat"] == pytest.approx(52.85)


@pytest.mark.anyio
async def test_weather_forecast_stub(api_client: AsyncClient, db) -> None:
    response = await api_client.get(
        "/api/v1/weather/forecast",
        params={"lat": 52.85, "lon": 19.67, "hours": 3},
    )
    assert response.status_code == 200
    hours = response.json()["hours"]
    assert len(hours) == 3


@pytest.mark.anyio
async def test_weather_cache_hit(api_client: AsyncClient, db, monkeypatch) -> None:
    monkeypatch.setenv("WEATHER_PROVIDER", "stub")
    from backend.settings import get_settings
    from backend.services.weather import reset_weather_service

    get_settings.cache_clear()
    reset_weather_service()

    snapshot = await StubWeatherProvider().get_current(52.85, 19.67)

    with patch(
        "backend.weather.stub.StubWeatherProvider.get_current",
        new_callable=AsyncMock,
        return_value=snapshot,
    ) as mock_current:
        r1 = await api_client.get(
            "/api/v1/weather/current",
            params={"lat": 52.85, "lon": 19.67},
        )
        r2 = await api_client.get(
            "/api/v1/weather/current",
            params={"lat": 52.85, "lon": 19.67},
        )
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert mock_current.await_count == 1


@pytest.mark.anyio
async def test_imgw_inpost_current_mocked(api_client: AsyncClient, db, monkeypatch) -> None:
    from datetime import UTC, datetime

    from backend.api.schemas.weather import WeatherCondition, WeatherSnapshot
    from backend.settings import get_settings
    from backend.services.weather import reset_weather_service

    monkeypatch.setenv("WEATHER_PROVIDER", "imgw_inpost")
    get_settings.cache_clear()
    reset_weather_service()

    fake = WeatherSnapshot(
        lat=52.85,
        lon=19.67,
        observed_at=datetime.now(UTC),
        condition=WeatherCondition.CLEAR,
        temperature_c=14.0,
        precipitation_mm_h=0.0,
        wind_speed_ms=0.83,
        is_outdoor_friendly=True,
        provider="imgw",
        station_name="Płock",
    )

    with patch(
        "backend.weather.imgw.ImgwSynopClient.get_current_snapshot",
        new_callable=AsyncMock,
        return_value=fake,
    ):
        response = await api_client.get(
            "/api/v1/weather/current",
            params={"lat": 52.85, "lon": 19.67},
        )
    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "imgw_inpost"
    assert body["temperature_c"] == 14.0
    assert body["station_name"] == "Płock"
