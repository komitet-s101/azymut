from __future__ import annotations

import csv
import logging
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path

from backend.db.models import (
    CatalogSource,
    Event,
    NeedsVerificationItem,
    OpeningHours,
    Place,
    PredefinedRoute,
    PriceLevel,
    RouteStop,
)

logger = logging.getLogger(__name__)


def _strip(value: str | None) -> str:
    return (value or "").strip()


def parse_bool(value: str | None) -> bool:
    return _strip(value).lower() == "true"


def parse_optional_int(value: str | None) -> int | None:
    text = _strip(value)
    if not text:
        return None
    return int(text)


def parse_optional_float(value: str | None) -> float | None:
    text = _strip(value)
    if not text:
        return None
    return float(text)


def parse_optional_decimal(value: str | None) -> Decimal | None:
    text = _strip(value)
    if not text:
        return None
    try:
        return Decimal(text)
    except InvalidOperation:
        return None


def parse_optional_price_level(value: str | None) -> PriceLevel | None:
    text = _strip(value)
    if not text:
        return None
    return PriceLevel(int(text))


def parse_optional_date(value: str | None) -> date | None:
    text = _strip(value)
    if not text:
        return None
    return date.fromisoformat(text)


def parse_optional_datetime(value: str | None) -> datetime | None:
    text = _strip(value)
    if not text:
        return None
    return datetime.fromisoformat(text)


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


async def clear_catalog() -> None:
    await RouteStop.all().delete()
    await OpeningHours.all().delete()
    await Event.all().delete()
    await NeedsVerificationItem.all().delete()
    await CatalogSource.all().delete()
    await PredefinedRoute.all().delete()
    await Place.all().delete()


async def load_catalog_from_dir(
    seed_dir: Path,
    *,
    force: bool = False,
) -> dict[str, int]:
    if force:
        await clear_catalog()
    elif await Place.all().count() > 0:
        count = await Place.all().count()
        logger.info("Catalog already seeded (%s places), skipping", count)
        return {"places": count, "skipped": True}

    place_key_to_id: dict[str, int] = {}
    route_key_to_id: dict[str, int] = {}

    for row in _read_csv(seed_dir / "places.csv"):
        ext_id = _strip(row["id"])
        place = await Place.create(
            external_id=ext_id,
            name=row["name"],
            description=_strip(row.get("description")) or None,
            city=row["city"],
            gmina=row["gmina"],
            address_line=_strip(row.get("address_line")) or None,
            latitude=parse_optional_float(row.get("latitude")),
            longitude=parse_optional_float(row.get("longitude")),
            coords_source=_strip(row.get("coords_source")) or None,
            category=row["category"],
            secondary_categories=_strip(row.get("secondary_categories")) or None,
            is_indoor=parse_bool(row.get("is_indoor")),
            is_outdoor=parse_bool(row.get("is_outdoor")),
            adult_only=parse_bool(row.get("adult_only")),
            min_age_recommended=parse_optional_int(row.get("min_age_recommended")),
            typical_visit_minutes=int(row["typical_visit_minutes"]),
            typical_visit_estimated=parse_bool(row.get("typical_visit_estimated"))
            if _strip(row.get("typical_visit_estimated"))
            else False,
            price_level=parse_optional_price_level(row.get("price_level")),
            price_max_pln=parse_optional_decimal(row.get("price_max_pln")),
            price_notes=_strip(row.get("price_notes")) or None,
            participation_mode=_strip(row.get("participation_mode")) or None,
            public_access=_strip(row.get("public_access")) or None,
            gastro_intensity=int(row.get("gastro_intensity") or 0),
            game_interactivity=int(row.get("game_interactivity") or 0),
            physical_activity_level=int(row.get("physical_activity_level") or 0),
            cultural_education=int(row.get("cultural_education") or 0),
            nature_relaxation=int(row.get("nature_relaxation") or 0),
            family_friendly=int(row.get("family_friendly") or 0),
            rain_suitable=int(row.get("rain_suitable") or 0),
            tags=_strip(row.get("tags")) or None,
            official_url=_strip(row.get("official_url")) or None,
            booking_url=_strip(row.get("booking_url")) or None,
            source_urls=_strip(row.get("source_urls")) or None,
            verification_status=_strip(row.get("verification_status")) or None,
            missing_fields=_strip(row.get("missing_fields")) or None,
        )
        place_key_to_id[ext_id] = place.id

    for row in _read_csv(seed_dir / "opening_hours.csv"):
        place_ext = _strip(row["place_id"])
        place_id = place_key_to_id.get(place_ext)
        if place_id is None:
            logger.warning("Opening hours: unknown place_id %s", place_ext)
            continue
        await OpeningHours.create(
            place_id=place_id,
            day_of_week=int(row["day_of_week"]),
            opens_at=row["opens_at"],
            closes_at=row["closes_at"],
            season_note=_strip(row.get("season_note")) or None,
            source_url=_strip(row.get("source_url")) or None,
        )

    for row in _read_csv(seed_dir / "predefined_routes.csv"):
        ext_id = _strip(row["id"])
        route = await PredefinedRoute.create(
            external_id=ext_id,
            name=row["name"],
            description=_strip(row.get("description")) or None,
            duration_minutes_approx=int(row["duration_minutes_approx"]),
            stops_min=int(row["stops_min"]),
            stops_max=int(row["stops_max"]),
            city=row["city"],
            gmina=row["gmina"],
            price_level_max=parse_optional_price_level(row.get("price_level_max")),
            route_type=_strip(row.get("route_type")) or None,
            category=_strip(row.get("category")) or None,
            source_url=_strip(row.get("source_url")) or None,
        )
        route_key_to_id[ext_id] = route.id

    for row in _read_csv(seed_dir / "route_stops.csv"):
        route_ext = _strip(row["route_id"])
        place_ext = _strip(row["place_id"])
        route_id = route_key_to_id.get(route_ext)
        place_id = place_key_to_id.get(place_ext)
        if route_id is None or place_id is None:
            logger.warning(
                "Route stop skipped: route=%s place=%s", route_ext, place_ext
            )
            continue
        await RouteStop.create(
            route_id=route_id,
            place_id=place_id,
            sequence=int(row["sequence"]),
            dwell_minutes=parse_optional_int(row.get("dwell_minutes")),
        )

    for row in _read_csv(seed_dir / "events.csv"):
        place_ext = _strip(row.get("place_id"))
        place_id = place_key_to_id.get(place_ext) if place_ext else None
        start = parse_optional_date(row.get("start_date"))
        if start is None:
            logger.warning("Event %s missing start_date, skipping", row.get("id"))
            continue
        await Event.create(
            external_id=_strip(row["id"]),
            name=row["name"],
            description=_strip(row.get("description")) or None,
            place_id=place_id,
            venue_name=_strip(row.get("venue_name")) or None,
            address_line=_strip(row.get("address_line")) or None,
            city=_strip(row.get("city")) or None,
            gmina=_strip(row.get("gmina")) or None,
            latitude=parse_optional_float(row.get("latitude")),
            longitude=parse_optional_float(row.get("longitude")),
            start_date=start,
            start_time=_strip(row.get("start_time")) or None,
            end_time=_strip(row.get("end_time")) or None,
            category=_strip(row.get("category")) or None,
            sport=_strip(row.get("sport")) or None,
            competition=_strip(row.get("competition")) or None,
            age_group=_strip(row.get("age_group")) or None,
            gender=_strip(row.get("gender")) or None,
            home_team=_strip(row.get("home_team")) or None,
            away_team=_strip(row.get("away_team")) or None,
            price_level=parse_optional_price_level(row.get("price_level")),
            price_max_pln=parse_optional_decimal(row.get("price_max_pln")),
            is_free=parse_bool(row.get("is_free")),
            participation_mode=_strip(row.get("participation_mode")) or None,
            status=_strip(row.get("status")) or None,
            official_url=_strip(row.get("official_url")) or None,
            booking_url=_strip(row.get("booking_url")) or None,
            source_url=_strip(row.get("source_url")) or None,
        )

    for row in _read_csv(seed_dir / "sources.csv"):
        await CatalogSource.create(
            url=row["url"],
            accessed_at=parse_optional_datetime(row.get("accessed_at")),
            status=_strip(row.get("status")) or None,
            what_it_confirms=_strip(row.get("what_it_confirms")) or None,
        )

    for row in _read_csv(seed_dir / "needs_verification.csv"):
        await NeedsVerificationItem.create(
            record_external_id=_strip(row["record_id"]),
            source_file=_strip(row["file"]),
            issue=row["issue"],
            fields=_strip(row.get("fields")) or None,
        )

    counts = {
        "places": len(place_key_to_id),
        "opening_hours": await OpeningHours.all().count(),
        "routes": len(route_key_to_id),
        "route_stops": await RouteStop.all().count(),
        "events": await Event.all().count(),
        "sources": await CatalogSource.all().count(),
        "needs_verification": await NeedsVerificationItem.all().count(),
    }
    logger.info(
        "Seeded %s places, %s opening_hours, %s routes, %s route_stops, "
        "%s events, %s sources, %s needs_verification",
        counts["places"],
        counts["opening_hours"],
        counts["routes"],
        counts["route_stops"],
        counts["events"],
        counts["sources"],
        counts["needs_verification"],
    )
    return counts


_PREDEFINED_ROUTE_PREFIXES = ("DAY-R", "PLK-R", "REG-R")


def _route_prefix_allowed(external_id: str, prefixes: tuple[str, ...]) -> bool:
    return any(external_id.startswith(prefix) for prefix in prefixes)


async def upsert_predefined_routes(
    seed_dir: Path,
    prefixes: tuple[str, ...] = _PREDEFINED_ROUTE_PREFIXES,
) -> dict[str, int]:
    """Dopisz brakujące trasy predefiniowane z CSV (bez czyszczenia katalogu)."""
    place_key_to_id: dict[str, int] = {}
    for place in await Place.all():
        if place.external_id:
            place_key_to_id[place.external_id] = place.id

    route_key_to_id: dict[str, int] = {}
    created_routes = 0

    for row in _read_csv(seed_dir / "predefined_routes.csv"):
        ext_id = _strip(row["id"])
        if not _route_prefix_allowed(ext_id, prefixes):
            continue
        existing = await PredefinedRoute.get_or_none(external_id=ext_id)
        if existing is not None:
            route_key_to_id[ext_id] = existing.id
            continue
        route = await PredefinedRoute.create(
            external_id=ext_id,
            name=row["name"],
            description=_strip(row.get("description")) or None,
            duration_minutes_approx=int(row["duration_minutes_approx"]),
            stops_min=int(row["stops_min"]),
            stops_max=int(row["stops_max"]),
            city=row["city"],
            gmina=row["gmina"],
            price_level_max=parse_optional_price_level(row.get("price_level_max")),
            route_type=_strip(row.get("route_type")) or None,
            category=_strip(row.get("category")) or None,
            source_url=_strip(row.get("source_url")) or None,
        )
        route_key_to_id[ext_id] = route.id
        created_routes += 1

    created_stops = 0
    for row in _read_csv(seed_dir / "route_stops.csv"):
        route_ext = _strip(row["route_id"])
        if not _route_prefix_allowed(route_ext, prefixes):
            continue
        place_ext = _strip(row["place_id"])
        route_id = route_key_to_id.get(route_ext)
        place_id = place_key_to_id.get(place_ext)
        if route_id is None or place_id is None:
            logger.warning(
                "Day-trip stop skipped: route=%s place=%s", route_ext, place_ext
            )
            continue
        sequence = int(row["sequence"])
        exists = await RouteStop.filter(route_id=route_id, sequence=sequence).exists()
        if exists:
            continue
        await RouteStop.create(
            route_id=route_id,
            place_id=place_id,
            sequence=sequence,
            dwell_minutes=parse_optional_int(row.get("dwell_minutes")),
        )
        created_stops += 1

    logger.info(
        "Predefined route upsert: %s new routes, %s new stops (%s)",
        created_routes,
        created_stops,
        ", ".join(prefixes),
    )
    return {
        "predefined_routes_created": created_routes,
        "predefined_route_stops_created": created_stops,
    }


async def upsert_day_trip_routes(seed_dir: Path) -> dict[str, int]:
    """Zachowane dla kompatybilności — tylko DAY-R*."""
    return await upsert_predefined_routes(seed_dir, prefixes=("DAY-R",))
