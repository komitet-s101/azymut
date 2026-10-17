from __future__ import annotations

import pytest

from backend.db.config import SEED_CSV_DIR
from backend.db.models import (
    CatalogSource,
    Event,
    NeedsVerificationItem,
    OpeningHours,
    Place,
    PredefinedRoute,
    RouteStop,
)
from backend.seed_csv import load_catalog_from_dir
from db_helpers import init_test_db


@pytest.fixture
async def seeded_db(tmp_path):
    db_file = tmp_path / "seed_test.db"
    await init_test_db(db_file)
    await load_catalog_from_dir(SEED_CSV_DIR, force=True)
    yield
    from tortoise import Tortoise

    await Tortoise.close_connections()


@pytest.mark.anyio
async def test_seed_catalog_counts(seeded_db) -> None:
    assert await Place.all().count() == 316
    assert await OpeningHours.all().count() == 427
    assert await PredefinedRoute.all().count() == 97
    assert await RouteStop.all().count() == 302
    assert await Event.all().count() == 171
    assert await CatalogSource.all().count() == 525
    assert await NeedsVerificationItem.all().count() == 656


@pytest.mark.anyio
async def test_seed_catalog_profile_metrics(seeded_db) -> None:
    assert await Place.filter(gastro_intensity__gt=0).count() >= 1
    assert await Place.filter(game_interactivity__gt=0).count() >= 1


@pytest.mark.anyio
async def test_seed_places_without_coordinates(seeded_db) -> None:
    assert await Place.filter(latitude__isnull=True).count() == 4
    assert await RouteStop.all().count() == 302


@pytest.mark.anyio
async def test_seed_catalog_route_stop_order(seeded_db) -> None:
    route = await PredefinedRoute.get(external_id="PLK-R001")
    await route.fetch_related("stops")
    stops = sorted(route.stops, key=lambda s: s.sequence)
    assert len(stops) == 11
    assert stops[0].sequence == 1


@pytest.mark.anyio
async def test_seed_catalog_spot_checks(seeded_db) -> None:
    place = await Place.get(external_id="PLK-0001")
    hours = await OpeningHours.filter(place_id=place.id).count()
    assert hours > 0
    unknown_price = await Place.get(external_id="PLK-0020")
    assert unknown_price.price_level is None

    event = await Event.get(external_id="PLK-E0001")
    venue = await Place.get(id=event.place_id)
    assert venue.external_id == "PLK-0044"
