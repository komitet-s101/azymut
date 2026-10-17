from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from backend.api.schemas.orm import (
    OpeningHoursOut,
    PlaceOutBase,
    PlaceSummaryOut,
    RouteOutBase,
    RouteStopOut,
)
from backend.db.models import PriceLevel

__all__ = [
    "OpeningHoursOut",
    "PaginatedPlaces",
    "PaginatedRoutes",
    "PlaceDetailOut",
    "PlaceOut",
    "PlaceSummaryOut",
    "PriceLevel",
    "RouteDetailOut",
    "RouteOut",
    "RouteStopOut",
    "place_to_out",
    "route_to_out",
]


class PlaceOut(PlaceOutBase):
    distance_km: float | None = None
    distance_label: str | None = None


class PlaceDetailOut(PlaceOut):
    opening_hours: list[OpeningHoursOut] = Field(default_factory=list)


class RouteOut(RouteOutBase):
    distance_to_start_km: float | None = None
    distance_label: str | None = None


class RouteDetailOut(RouteOut):
    stops: list[RouteStopOut] = Field(default_factory=list)


class PaginatedPlaces(BaseModel):
    items: list[PlaceOut]
    total: int
    limit: int
    offset: int


class PaginatedRoutes(BaseModel):
    items: list[RouteOut]
    total: int
    limit: int
    offset: int


def place_to_out(place: Any, distance_km: float | None = None) -> PlaceOut:
    data = PlaceOut.model_validate(place)
    if distance_km is not None:
        from backend.api.geo import distance_label_km

        data.distance_km = round(distance_km, 2)
        data.distance_label = distance_label_km(distance_km)
    return data


def route_to_out(route: Any, distance_km: float | None = None) -> RouteOut:
    data = RouteOut.model_validate(route)
    if distance_km is not None:
        from backend.api.geo import distance_label_km

        data.distance_to_start_km = round(distance_km, 2)
        data.distance_label = distance_label_km(distance_km)
    return data
