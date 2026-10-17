from __future__ import annotations

from typing import Any

from fastapi import HTTPException

from backend.api.schemas.plan import (
    PlanAlternative,
    PlanRequest,
    PlanResponse,
    PlanStep,
)
from backend.llm.assembler import (
    build_retry_user_message,
    build_system_prompt,
    build_user_message,
)
from backend.llm.client import LLMClient, LLMUnavailableError
from backend.llm.parser import CandidateIds, parse_plan_response
from backend.services.catalog_query import (
    PlannerCandidates,
    _load_interest_package,
    candidates_payload,
    fetch_planner_candidates,
    has_any_candidates,
)
from backend.services.plan_enricher import enrich_plan
from backend.services.weather import get_weather_service
from backend.settings import get_settings


def _weather_note_from_context(weather_context: dict[str, Any] | None) -> str | None:
    if not weather_context:
        return None
    if weather_context.get("is_outdoor_friendly") is False:
        return "Pogoda nie sprzyja długiemu pobytowi na zewnątrz — rozważ miejsca pod dachem."
    return None


async def _build_weather_context(
    request: PlanRequest,
) -> tuple[dict[str, Any] | None, bool]:
    lat: float | None = None
    lon: float | None = None
    if request.weather is not None:
        lat = request.weather.lat
        lon = request.weather.lon
    if lat is None or lon is None:
        return None, False

    service = get_weather_service()
    snapshot = await service.get_current(lat, lon)
    ctx = {
        "is_outdoor_friendly": snapshot.is_outdoor_friendly,
        "condition": snapshot.condition,
        "temperature_c": snapshot.temperature_c,
        "precipitation_mm_h": snapshot.precipitation_mm_h,
        "wind_speed_ms": snapshot.wind_speed_ms,
    }
    return ctx, True


def _stub_plan(
    request: PlanRequest,
    candidates: PlannerCandidates,
) -> PlanResponse:
    if request.persona == "tourist" and candidates.routes:
        route = candidates.routes[0]
        route_id = route["route_id"]
        stop_ids = route["stop_place_ids"]
        steps: list[PlanStep] = []
        for idx, pid in enumerate(stop_ids, start=1):
            if pid not in candidates.place_ids:
                continue
            steps.append(
                PlanStep(
                    sequence=idx,
                    place_id=pid,
                    reason="Przystanek na trasie (tryb deweloperski).",
                )
            )
        alt: list[PlanAlternative] = []
        if len(candidates.routes) > 1:
            alt_route = candidates.routes[1]["route_id"]
            alt = [
                PlanAlternative(
                    route_id=alt_route,
                    reason="Krótsza alternatywna trasa.",
                )
            ]
        return PlanResponse(
            title=f"Trasa: {route['name']}",
            persona_used=request.persona,
            primary_type="route",
            route_id=route_id,
            steps=steps,
            alternatives=alt,
            tips=["Plan wygenerowany w trybie PLANNER_STUB."],
        )

    place_rows = candidates.places[: min(4, len(candidates.places))]
    steps = [
        PlanStep(
            sequence=i + 1,
            place_id=row["place_id"],
            reason="Dopasowanie do profilu (tryb deweloperski).",
        )
        for i, row in enumerate(place_rows)
    ]
    alt: list[PlanAlternative] = []
    if len(candidates.places) > len(place_rows):
        backup = candidates.places[len(place_rows)]
        alt = [
            PlanAlternative(
                place_id=backup["place_id"],
                reason="Alternatywa na deszcz lub krótszy pobyt.",
            )
        ]
    title = "Plan na dziś"
    if place_rows:
        title = f"{place_rows[0]['name']} i okolica"
    return PlanResponse(
        title=title,
        persona_used=request.persona,
        primary_type="places",
        route_id=None,
        steps=steps,
        alternatives=alt,
        tips=["Plan wygenerowany w trybie PLANNER_STUB."],
    )


async def _call_llm_plan(
    request: PlanRequest,
    candidates: PlannerCandidates,
    weather_context: dict[str, Any] | None,
) -> PlanResponse:
    package = _load_interest_package(request.interest_package_id)
    user_message = build_user_message(
        request,
        interest_package=package,
        weather_context=weather_context,
        candidates=candidates_payload(candidates),
    )
    system = build_system_prompt(request.persona)
    messages: list[dict[str, str]] = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_message},
    ]
    candidate_ids = CandidateIds(
        place_ids=candidates.place_ids,
        route_ids=candidates.route_ids,
    )
    client = LLMClient()
    settings = get_settings()
    raw = await client.chat_completion(messages)
    plan, errors = parse_plan_response(raw, candidate_ids)
    if plan is not None:
        return plan

    retry_msg = build_retry_user_message(errors)
    messages.append({"role": "assistant", "content": raw})
    messages.append({"role": "user", "content": retry_msg})
    raw_retry = await client.chat_completion(
        messages,
        temperature=settings.llm_retry_temperature,
    )
    plan, errors = parse_plan_response(raw_retry, candidate_ids)
    if plan is not None:
        return plan

    raise HTTPException(
        status_code=422,
        detail="Nie udało się zbudować planu — zmień czas lub budżet",
    )


async def generate_plan(request: PlanRequest):
    candidates = await fetch_planner_candidates(request)
    if not has_any_candidates(candidates):
        raise HTTPException(
            status_code=422,
            detail="Brak pasujących miejsc — zmień czas lub budżet",
        )

    weather_context, weather_used = await _build_weather_context(request)
    settings = get_settings()

    if settings.planner_stub:
        plan = _stub_plan(request, candidates)
        planner_name = "stub"
    else:
        try:
            plan = await _call_llm_plan(request, candidates, weather_context)
            planner_name = "bielik"
        except LLMUnavailableError:
            raise HTTPException(
                status_code=503,
                detail="Planer chwilowo niedostępny",
            ) from None

    weather_note = _weather_note_from_context(weather_context)
    return await enrich_plan(
        plan,
        planner_name=planner_name,
        candidates_routes=len(candidates.routes),
        candidates_places=len(candidates.places),
        weather_used=weather_used,
        weather_note=weather_note,
    )
