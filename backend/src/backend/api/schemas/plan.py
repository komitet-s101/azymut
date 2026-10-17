from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

from backend.api.schemas.catalog import PlaceDetailOut, RouteDetailOut

Persona = Literal["tourist", "resident"]


class PartyConstraints(BaseModel):
    adults: int = Field(ge=1)
    kids_ages: list[int] = Field(default_factory=list)


class UserConstraints(BaseModel):
    budget_max_pln: int = Field(ge=0)
    available_minutes: int = Field(ge=1)
    day_of_week: int = Field(ge=0, le=6)
    window_start: str = Field(pattern=r"^\d{2}:\d{2}$")
    window_end: str = Field(pattern=r"^\d{2}:\d{2}$")
    party: PartyConstraints


class UserProfile(BaseModel):
    bmi: float | None = None
    likes_games: int = Field(default=0, ge=0, le=5)
    prefer_outdoor: bool = False
    gastro_intensity_preference: int = Field(default=0, ge=0, le=5)
    physical_activity_preference: int = Field(default=0, ge=0, le=5)


class UserContext(BaseModel):
    schema_version: Literal[1] = 1
    persona: Persona
    interest_package_id: str
    custom_request: str = ""
    constraints: UserConstraints
    profile: UserProfile
    last_plan_id: str | None = None


class PlanWeatherInput(BaseModel):
    lat: float
    lon: float


class PlanRequest(UserContext):
    weather: PlanWeatherInput | None = None


class PlanStep(BaseModel):
    sequence: int = Field(ge=1)
    place_id: int
    start_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    end_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    dwell_minutes: int | None = Field(default=None, ge=1)
    reason: str | None = None


class PlanAlternative(BaseModel):
    place_id: int | None = None
    route_id: int | None = None
    reason: str | None = None


class PlanResponse(BaseModel):
    title: str
    persona_used: Persona | None = None
    primary_type: Literal["route", "places"]
    route_id: int | None = None
    steps: list[PlanStep] = Field(default_factory=list)
    alternatives: list[PlanAlternative] = Field(default_factory=list)
    tips: list[str] = Field(default_factory=list)


class PlanDisplay(BaseModel):
    title: str
    summary: str | None = None
    weather_note: str | None = None


class PlanMeta(BaseModel):
    planner: str
    candidates_routes: int
    candidates_places: int
    weather_used: bool = False


class PlanEnrichedResponse(BaseModel):
    plan: PlanResponse
    display: PlanDisplay
    route: RouteDetailOut | None = None
    places: dict[str, PlaceDetailOut] = Field(default_factory=dict)
    meta: PlanMeta | dict[str, Any] | None = None
