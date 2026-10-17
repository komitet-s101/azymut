from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from backend.api.schemas.admin import RouteCreate, RouteStopsReplace, RouteUpdate
from backend.api.schemas.catalog import PaginatedRoutes, RouteDetailOut, route_to_out
from backend.api.schemas.orm import RouteStopOut
from backend.services import admin_catalog, catalog

router = APIRouter(prefix="/admin/routes", tags=["admin"])


@router.get("", response_model=PaginatedRoutes)
async def admin_list_routes(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> PaginatedRoutes:
    routes, total = await admin_catalog.admin_list_routes(limit, offset)
    items = [route_to_out(r, None) for r in routes]
    return PaginatedRoutes(items=items, total=total, limit=limit, offset=offset)


def _route_detail_out(route) -> RouteDetailOut:
    stops_out = [
        RouteStopOut.model_validate(stop) for stop in catalog.route_stops_ordered(route)
    ]
    base = route_to_out(route)
    return RouteDetailOut(**base.model_dump(), stops=stops_out)


@router.post("", response_model=RouteDetailOut, status_code=201)
async def admin_create_route(body: RouteCreate) -> RouteDetailOut:
    route = await admin_catalog.admin_create_route(body)
    detail = await catalog.get_route_detail(route.id)
    assert detail is not None
    return _route_detail_out(detail)


@router.patch("/{route_id}", response_model=RouteDetailOut)
async def admin_update_route(route_id: int, body: RouteUpdate) -> RouteDetailOut:
    route = await admin_catalog.admin_update_route(route_id, body)
    if route is None:
        raise HTTPException(status_code=404, detail="Route not found")
    detail = await catalog.get_route_detail(route_id)
    assert detail is not None
    return _route_detail_out(detail)


@router.delete("/{route_id}", status_code=204)
async def admin_delete_route(route_id: int) -> None:
    if not await admin_catalog.admin_delete_route(route_id):
        raise HTTPException(status_code=404, detail="Route not found")


@router.put("/{route_id}/stops", response_model=RouteDetailOut)
async def admin_replace_route_stops(
    route_id: int,
    body: RouteStopsReplace,
) -> RouteDetailOut:
    try:
        rows = await admin_catalog.admin_replace_route_stops(route_id, body.stops)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if rows is None:
        raise HTTPException(status_code=404, detail="Route not found")
    detail = await catalog.get_route_detail(route_id)
    assert detail is not None
    return _route_detail_out(detail)
