from __future__ import annotations

import argparse
import asyncio
import json
import logging
from decimal import Decimal
from pathlib import Path

from tortoise import Tortoise

from backend.db.config import DB_DIR, TORTOISE_ORM
from backend.db.models import (
    OpeningHours,
    Place,
    PredefinedRoute,
    PriceLevel,
    RouteStop,
)

logger = logging.getLogger(__name__)

SEED_PATH = Path("data/seed/catalog.json")


async def clear_catalog() -> None:
    await RouteStop.all().delete()
    await OpeningHours.all().delete()
    await PredefinedRoute.all().delete()
    await Place.all().delete()


async def seed_from_data(data: dict, *, force: bool = False) -> None:
    if force:
        await clear_catalog()
    elif await Place.all().count() > 0:
        logger.info(
            "Catalog already seeded (%s places), skipping",
            await Place.all().count(),
        )
        return

    place_key_to_id: dict[str, int] = {}
    for row in data["places"]:
        place = await Place.create(
            name=row["name"],
            description=row.get("description"),
            city=row["city"],
            gmina=row["gmina"],
            address_line=row.get("address_line"),
            latitude=row["latitude"],
            longitude=row["longitude"],
            category=row["category"],
            is_indoor=row["is_indoor"],
            is_outdoor=row["is_outdoor"],
            adult_only=row.get("adult_only", False),
            min_age_recommended=row.get("min_age_recommended"),
            typical_visit_minutes=row["typical_visit_minutes"],
            price_level=PriceLevel(row["price_level"]),
            price_max_pln=Decimal(str(row["price_max_pln"]))
            if row.get("price_max_pln") is not None
            else None,
            gastro_intensity=row.get("gastro_intensity", 0),
            game_interactivity=row.get("game_interactivity", 0),
            physical_activity_level=row.get("physical_activity_level", 0),
            cultural_education=row.get("cultural_education", 0),
            nature_relaxation=row.get("nature_relaxation", 0),
            family_friendly=row.get("family_friendly", 0),
            rain_suitable=row.get("rain_suitable", 0),
        )
        place_key_to_id[row["key"]] = place.id

        for oh in row.get("opening_hours", []):
            await OpeningHours.create(
                place_id=place.id,
                day_of_week=oh["day_of_week"],
                opens_at=oh["opens_at"],
                closes_at=oh["closes_at"],
            )

    route_key_to_id: dict[str, int] = {}
    for row in data["routes"]:
        route = await PredefinedRoute.create(
            name=row["name"],
            description=row.get("description"),
            duration_minutes_approx=row["duration_minutes_approx"],
            stops_min=row["stops_min"],
            stops_max=row["stops_max"],
            city=row["city"],
            gmina=row["gmina"],
            price_level_max=PriceLevel(row["price_level_max"])
            if row.get("price_level_max") is not None
            else None,
        )
        route_key_to_id[row["key"]] = route.id

    for stop in data["route_stops"]:
        await RouteStop.create(
            route_id=route_key_to_id[stop["route_key"]],
            place_id=place_key_to_id[stop["place_key"]],
            sequence=stop["sequence"],
            dwell_minutes=stop.get("dwell_minutes"),
        )

    logger.info(
        "Seeded %s places, %s routes",
        len(place_key_to_id),
        len(route_key_to_id),
    )


async def run_seed(seed_path: Path = SEED_PATH, *, force: bool = False) -> None:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    await Tortoise.init(config=TORTOISE_ORM)
    if not seed_path.is_file():
        raise FileNotFoundError(f"Missing seed file: {seed_path}")
    payload = json.loads(seed_path.read_text(encoding="utf-8"))
    await seed_from_data(payload, force=force)
    await Tortoise.close_connections()


def main() -> None:
    parser = argparse.ArgumentParser(description="Load demo catalog seed data")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Clear catalog tables and reload seed (keeps migration history)",
    )
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run_seed(force=args.force))


if __name__ == "__main__":
    main()
