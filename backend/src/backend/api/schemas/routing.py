from __future__ import annotations

from pydantic import BaseModel, Field


class WalkWaypoint(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class WalkRouteRequest(BaseModel):
    waypoints: list[WalkWaypoint] = Field(min_length=2, max_length=8)


class WalkRouteResponse(BaseModel):
    coordinates: list[tuple[float, float]]
    distance_km: float
    duration_minutes: float | None = None
    provider: str = "osrm"
