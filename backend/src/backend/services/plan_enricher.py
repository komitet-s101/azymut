from __future__ import annotations

from backend.api.schemas.catalog import OpeningHoursOut, PlaceDetailOut, RouteDetailOut, RouteStopOut, place_to_out, route_to_out
from backend.api.schemas.plan import PlanDisplay, PlanEnrichedResponse, PlanMeta, PlanResponse, PlanStep
from backend.services import catalog


async def enrich_plan(
    plan: PlanResponse,
    *,
    planner_name: str,
    candidates_routes: int,
    candidates_places: int,
    weather_used: bool,
    weather_note: str | None = None,
) -> PlanEnrichedResponse:
    place_ids = {step.place_id for step in plan.steps}
    for alt in plan.alternatives:
        if alt.place_id is not None:
            place_ids.add(alt.place_id)

    places_out: dict[str, PlaceDetailOut] = {}
    for pid in place_ids:
        place = await catalog.get_place_detail(pid)
        if place is None:
            continue
        hours = [
            OpeningHoursOut.model_validate(h)
            for h in sorted(place.opening_hours, key=lambda x: x.day_of_week)
        ]
        base = place_to_out(place)
        places_out[str(pid)] = PlaceDetailOut(**base.model_dump(), opening_hours=hours)

    valid_steps: list[PlanStep] = []
    for step in plan.steps:
        if str(step.place_id) in places_out:
            valid_steps.append(step)
    plan = plan.model_copy(update={"steps": valid_steps})

    route_out: RouteDetailOut | None = None
    if plan.route_id is not None:
        route = await catalog.get_route_detail(plan.route_id)
        if route is not None:
            stops_out = [
                RouteStopOut.model_validate(stop)
                for stop in catalog.route_stops_ordered(route)
            ]
            base = route_to_out(route)
            route_out = RouteDetailOut(**base.model_dump(), stops=stops_out)

    summary = None
    if plan.tips:
        summary = " ".join(plan.tips[:2])

    display = PlanDisplay(
        title=plan.title,
        summary=summary,
        weather_note=weather_note,
    )

    meta = PlanMeta(
        planner=planner_name,
        candidates_routes=candidates_routes,
        candidates_places=candidates_places,
        weather_used=weather_used,
    )

    return PlanEnrichedResponse(
        plan=plan,
        display=display,
        route=route_out,
        places=places_out,
        meta=meta,
    )
