from __future__ import annotations

from backend.api.schemas.plan import PlanResponse
from backend.llm.parser import CandidateIds, parse_plan_response


def test_parse_valid_plan() -> None:
    raw = """
    {
      "title": "Test",
      "persona_used": "resident",
      "primary_type": "places",
      "route_id": null,
      "steps": [{"sequence": 1, "place_id": 3, "reason": "ok"}],
      "alternatives": [],
      "tips": ["tip"]
    }
    """
    plan, errors = parse_plan_response(
        raw,
        CandidateIds(place_ids={3}, route_ids=set()),
    )
    assert errors == []
    assert plan is not None
    assert plan.title == "Test"


def test_reject_unknown_place_id() -> None:
    raw = '{"title":"x","primary_type":"places","steps":[{"sequence":1,"place_id":99}]}'
    plan, errors = parse_plan_response(
        raw,
        CandidateIds(place_ids={1}, route_ids=set()),
    )
    assert plan is None
    assert any("99" in e for e in errors)


def test_strip_markdown_fence() -> None:
    raw = """```json
    {"title":"T","primary_type":"places","steps":[]}
    ```"""
    plan, errors = parse_plan_response(
        raw,
        CandidateIds(place_ids=set(), route_ids=set()),
    )
    assert errors == []
    assert isinstance(plan, PlanResponse)
