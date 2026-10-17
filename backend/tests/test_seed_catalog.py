from __future__ import annotations

import json
from pathlib import Path

import pytest

from backend.db.models import OpeningHours, Place, PredefinedRoute, RouteStop
from backend.seed import SEED_PATH, seed_from_data
from db_helpers import init_test_db

SEED_FILE = Path(__file__).resolve().parents[1] / SEED_PATH


@pytest.fixture
async def seeded_db(tmp_path):
    db_file = tmp_path / "seed_test.db"
    await init_test_db(db_file)
    payload = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    await seed_from_data(payload)
    yield
    from tortoise import Tortoise

    await Tortoise.close_connections()


@pytest.mark.anyio
async def test_seed_catalog_counts(seeded_db) -> None:
    assert await Place.all().count() == 12
    assert await PredefinedRoute.all().count() == 3
    assert await RouteStop.all().count() == 9
    assert await OpeningHours.all().count() > 0


@pytest.mark.anyio
async def test_seed_catalog_profile_metrics(seeded_db) -> None:
    assert await Place.filter(gastro_intensity__gt=0).count() >= 1
    assert await Place.filter(game_interactivity__gt=0).count() >= 1


@pytest.mark.anyio
async def test_seed_catalog_route_stop_order(seeded_db) -> None:
    route = await PredefinedRoute.first()
    assert route is not None
    await route.fetch_related("stops")
    stops = sorted(route.stops, key=lambda s: s.sequence)
    assert len(stops) == 3
    assert [s.sequence for s in stops] == [1, 2, 3]
