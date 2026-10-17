from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.api.schemas.routing import WalkRouteRequest, WalkRouteResponse
from backend.services.osrm import OsrmRoutingError, fetch_walking_route

router = APIRouter(prefix="/routing", tags=["routing"])


@router.post("/walk", response_model=WalkRouteResponse)
async def walk_route(body: WalkRouteRequest) -> WalkRouteResponse:
    waypoints = [(point.lat, point.lon) for point in body.waypoints]
    try:
        coordinates, distance_km, duration_minutes = await fetch_walking_route(waypoints)
    except OsrmRoutingError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return WalkRouteResponse(
        coordinates=coordinates,
        distance_km=round(distance_km, 2),
        duration_minutes=round(duration_minutes, 1) if duration_minutes is not None else None,
    )
