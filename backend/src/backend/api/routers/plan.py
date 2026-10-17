from __future__ import annotations

from fastapi import APIRouter

from backend.api.schemas.plan import PlanEnrichedResponse, PlanRequest
from backend.services.planner import generate_plan

router = APIRouter(tags=["plan"])


@router.post("/plan", response_model=PlanEnrichedResponse)
async def create_plan(body: PlanRequest) -> PlanEnrichedResponse:
    return await generate_plan(body)
