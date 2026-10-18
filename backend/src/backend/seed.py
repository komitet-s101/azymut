from __future__ import annotations

import argparse
import asyncio
import logging

from tortoise import Tortoise

from backend.db.config import DB_DIR, SEED_CSV_DIR, TORTOISE_ORM
from backend.seed_csv import load_catalog_from_dir, upsert_day_trip_routes, upsert_predefined_routes

logger = logging.getLogger(__name__)

SEED_DIR = SEED_CSV_DIR


async def run_seed(
    *,
    force: bool = False,
    day_trips_only: bool = False,
    predefined_routes_only: bool = False,
) -> None:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    await Tortoise.init(config=TORTOISE_ORM)
    if not SEED_DIR.is_dir():
        raise FileNotFoundError(f"Missing seed directory: {SEED_DIR}")
    if predefined_routes_only:
        await upsert_predefined_routes(SEED_DIR)
    elif day_trips_only:
        await upsert_day_trip_routes(SEED_DIR)
    else:
        await load_catalog_from_dir(SEED_DIR, force=force)
    await Tortoise.close_connections()


def main() -> None:
    parser = argparse.ArgumentParser(description="Load catalog seed data from CSV")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Clear catalog tables and reload seed (keeps migration history)",
    )
    parser.add_argument(
        "--day-trips-only",
        action="store_true",
        help="Insert missing DAY-R* trasy from CSV (no wipe)",
    )
    parser.add_argument(
        "--predefined-routes-only",
        action="store_true",
        help="Insert missing DAY-R*, PLK-R*, REG-R* trasy from CSV (no wipe)",
    )
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    asyncio.run(
        run_seed(
            force=args.force,
            day_trips_only=args.day_trips_only,
            predefined_routes_only=args.predefined_routes_only,
        )
    )


if __name__ == "__main__":
    main()
