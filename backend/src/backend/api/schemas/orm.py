from __future__ import annotations

import asyncio

from pydantic import create_model
from tortoise import Tortoise
from tortoise.contrib.pydantic import PydanticModel, pydantic_model_creator

from backend.db.config import TORTOISE_ORM
from backend.db.models import OpeningHours, Place, PredefinedRoute, RouteStop

_tortoise_ready = False


def _ensure_tortoise() -> None:
    global _tortoise_ready
    if _tortoise_ready:
        return

    async def _init() -> None:
        await Tortoise.init(config=TORTOISE_ORM)

    asyncio.run(_init())
    _tortoise_ready = True


def _build_orm_schemas() -> None:
    global OpeningHoursOut
    global PlaceSummaryOut
    global PlaceOutBase
    global RouteOutBase
    global RouteStopOut

    _ensure_tortoise()

    OpeningHoursOut = pydantic_model_creator(
        OpeningHours,
        name="OpeningHoursOut",
        exclude=("id", "place", "place_id"),
    )
    PlaceSummaryOut = pydantic_model_creator(
        Place,
        name="PlaceSummaryOut",
        include=(
            "id",
            "name",
            "latitude",
            "longitude",
            "typical_visit_minutes",
            "gastro_intensity",
            "game_interactivity",
            "family_friendly",
            "rain_suitable",
        ),
    )
    PlaceOutBase = pydantic_model_creator(
        Place,
        name="PlaceOutBase",
        exclude=("opening_hours", "route_stops"),
    )
    RouteOutBase = pydantic_model_creator(
        PredefinedRoute,
        name="RouteOutBase",
        exclude=("stops",),
    )
    route_stop_partial = pydantic_model_creator(
        RouteStop,
        name="RouteStopPartial",
        include=("sequence", "dwell_minutes"),
    )
    RouteStopOut = create_model(
        "RouteStopOut",
        __base__=route_stop_partial,
        place=(PlaceSummaryOut, ...),
    )


OpeningHoursOut: type[PydanticModel]
PlaceSummaryOut: type[PydanticModel]
PlaceOutBase: type[PydanticModel]
RouteOutBase: type[PydanticModel]
RouteStopOut: type[PydanticModel]

_build_orm_schemas()
