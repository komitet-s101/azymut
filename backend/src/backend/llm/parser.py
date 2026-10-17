from __future__ import annotations

import json
import re
from typing import Any

from pydantic import ValidationError

from backend.api.schemas.plan import PlanResponse

_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def extract_json_object(raw: str) -> dict[str, Any]:
    text = raw.strip()
    text = _FENCE_RE.sub("", text).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError("No JSON object found in model output")
    return json.loads(text[start : end + 1])


def strip_extra_keys(data: dict[str, Any]) -> dict[str, Any]:
    allowed = set(PlanResponse.model_fields.keys())
    return {k: v for k, v in data.items() if k in allowed}


class CandidateIds:
    def __init__(
        self,
        place_ids: set[int],
        route_ids: set[int],
    ) -> None:
        self.place_ids = place_ids
        self.route_ids = route_ids


def validate_plan_against_candidates(
    data: dict[str, Any],
    candidates: CandidateIds,
) -> tuple[PlanResponse | None, list[str]]:
    errors: list[str] = []
    try:
        plan = PlanResponse.model_validate(strip_extra_keys(data))
    except ValidationError as exc:
        return None, [e["msg"] for e in exc.errors()]

    if plan.primary_type == "route":
        if plan.route_id is None:
            errors.append("route_id is required when primary_type is route")
        elif plan.route_id not in candidates.route_ids:
            errors.append(f"route_id {plan.route_id} not in candidates")

    if plan.primary_type == "places" and plan.route_id is not None:
        if plan.route_id not in candidates.route_ids:
            errors.append(f"route_id {plan.route_id} not in candidates")

    for step in plan.steps:
        if step.place_id not in candidates.place_ids:
            errors.append(f"place_id {step.place_id} in steps not in candidates")

    if len(plan.steps) > 4 and plan.primary_type == "places":
        errors.append("at most 4 steps allowed for primary_type places")

    if len(plan.alternatives) > 1:
        errors.append("at most 1 alternative allowed")

    for alt in plan.alternatives:
        if alt.place_id is not None and alt.place_id not in candidates.place_ids:
            errors.append(f"place_id {alt.place_id} in alternatives not in candidates")
        if alt.route_id is not None and alt.route_id not in candidates.route_ids:
            errors.append(f"route_id {alt.route_id} in alternatives not in candidates")

    if errors:
        return None, errors
    return plan, []


def parse_plan_response(
    raw: str,
    candidates: CandidateIds,
) -> tuple[PlanResponse | None, list[str]]:
    try:
        data = extract_json_object(raw)
    except (json.JSONDecodeError, ValueError) as exc:
        return None, [str(exc)]
    return validate_plan_against_candidates(data, candidates)
