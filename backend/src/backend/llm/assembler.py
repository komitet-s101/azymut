from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from backend.api.schemas.plan import Persona, PlanRequest

_PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"


def _read_prompt(name: str) -> str:
    return (_PROMPTS_DIR / name).read_text(encoding="utf-8").strip()


def build_system_prompt(persona: Persona) -> str:
    core = _read_prompt("system_core.pl.md")
    persona_file = "tourist.pl.md" if persona == "tourist" else "resident.pl.md"
    return f"{core}\n\n{_read_prompt(persona_file)}"


def build_user_context_block(request: PlanRequest) -> dict[str, Any]:
    ctx = request.model_dump(mode="json")
    profile = request.profile
    health_hint: str | None = None
    if profile.bmi is not None and profile.bmi >= 27:
        health_hint = "obniż wagę gastro_intensity; podnieś physical_activity_level"
    game_hint: str | None = None
    if profile.likes_games >= 4:
        game_hint = "preferuj wysokie game_interactivity"
    ctx["health_hint"] = health_hint
    ctx["game_hint"] = game_hint
    return ctx


def plan_response_example(first_place_id: int, persona: Persona) -> dict[str, Any]:
    return {
        "title": "Przykładowy tytuł po polsku",
        "persona_used": persona,
        "primary_type": "places",
        "route_id": None,
        "steps": [
            {
                "sequence": 1,
                "place_id": first_place_id,
                "start_time": "10:00",
                "end_time": "11:30",
                "reason": "Krótkie uzasadnienie po polsku.",
            }
        ],
        "alternatives": [],
        "tips": ["Jedna praktyczna wskazówka."],
    }


def build_user_message(
    request: PlanRequest,
    *,
    interest_package: dict[str, Any] | None,
    weather_context: dict[str, Any] | None,
    candidates: dict[str, Any],
) -> str:
    user_ctx = build_user_context_block(request)
    first_place_id = 0
    places = candidates.get("places") or []
    if places:
        first_place_id = places[0]["place_id"]
    example = plan_response_example(first_place_id, request.persona)

    parts = [
        "Zadanie: zaproponuj plan na podstawie danych poniżej.",
        "",
        "<USER_CONTEXT>",
        json.dumps(user_ctx, ensure_ascii=False, indent=2),
        "</USER_CONTEXT>",
        "",
        "<INTEREST_PACKAGE>",
        json.dumps(interest_package, ensure_ascii=False, indent=2),
        "</INTEREST_PACKAGE>",
        "",
        "<WEATHER_CONTEXT>",
        json.dumps(weather_context, ensure_ascii=False, indent=2),
        "</WEATHER_CONTEXT>",
        "",
        "<CANDIDATES>",
        json.dumps(candidates, ensure_ascii=False, indent=2),
        "</CANDIDATES>",
        "",
        "Przykład PlanResponse (uzupełnij własnymi id z CANDIDATES):",
        json.dumps(example, ensure_ascii=False, indent=2),
    ]
    return "\n".join(parts)


def build_retry_user_message(validation_errors: list[str]) -> str:
    template = _read_prompt("retry_user.pl.md")
    errors_text = "\n".join(f"- {e}" for e in validation_errors)
    return template.replace("{{VALIDATION_ERRORS}}", errors_text)
