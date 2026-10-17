from __future__ import annotations

import os
from collections.abc import AsyncIterator
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient
from tortoise import Tortoise

os.environ.setdefault("ADMIN_ENABLED", "true")
os.environ.setdefault("WEATHER_PROVIDER", "stub")
os.environ["GROQ_API_KEY"] = ""
os.environ["LLM_API_KEY"] = ""
os.environ["SEARCH_LLM_REASONS"] = "false"

from backend.api.app import create_app
from backend.settings import get_settings
from db_helpers import init_test_db


@pytest.fixture
def app(monkeypatch):
    monkeypatch.setenv("ADMIN_ENABLED", os.environ.get("ADMIN_ENABLED", "true"))
    monkeypatch.setenv("WEATHER_PROVIDER", os.environ.get("WEATHER_PROVIDER", "stub"))
    monkeypatch.setenv("GROQ_API_KEY", "")
    monkeypatch.setenv("LLM_API_KEY", "")
    monkeypatch.setenv("SEARCH_LLM_REASONS", "false")
    get_settings.cache_clear()
    from backend.services.weather import reset_weather_service

    reset_weather_service()
    return create_app()


@pytest.fixture
async def db(tmp_path) -> AsyncIterator[dict[str, Any]]:
    db_file = tmp_path / "test.db"
    config = await init_test_db(db_file)
    yield config
    await Tortoise.close_connections()


@pytest.fixture
async def api_client(db, app) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
