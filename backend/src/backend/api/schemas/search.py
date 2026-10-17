from __future__ import annotations

from datetime import date as DateType
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from backend.api.schemas.plan import Persona, UserConstraints, UserProfile


class PlaceCategory(StrEnum):
    HISTORIA_ZABYTKI = "historia_zabytki"
    SPORT_AKTYWNY_WYPOCZYNEK = "sport_aktywny_wypoczynek"
    SAKRALNE_WIELOKULTUROWOSC = "sakralne_wielokulturowosc"
    WARSZTATY_NAUKA_PASJE = "warsztaty_nauka_pasje"
    PRZYRODA_SPACERY_WIDOKI = "przyroda_spacery_widoki"
    JEDZENIE_LOKALNE_SMAKI = "jedzenie_lokalne_smaki"
    ZABAWA_GRY_ADRENALINA = "zabawa_gry_adrenalina"
    KIBICOWANIE_WYDARZENIA_SPORTOWE = "kibicowanie_wydarzenia_sportowe"
    KULTURA_SZTUKA_FILM = "kultura_sztuka_film"
    MUZYKA_WIDOWISKA = "muzyka_widowiska"
    RELAKS_WYPOCZYNEK = "relaks_wypoczynek"
    RZEMIOSLO_PAMIATKI_PRODUKTY = "rzemioslo_pamiatki_produkty"
    FESTIWALE_LOKALNE_SWIETA = "festiwale_lokalne_swieta"


class SettingPreference(StrEnum):
    INDOOR = "indoor"
    OUTDOOR = "outdoor"
    EITHER = "either"


class SearchGroup(BaseModel):
    model_config = ConfigDict(extra="ignore")

    adults: int = Field(default=1, ge=0, le=30)
    children: int = Field(default=0, ge=0, le=20)
    child_ages: list[int] = Field(default_factory=list)

    @field_validator("child_ages")
    @classmethod
    def _ages(cls, value: list[int]) -> list[int]:
        return [age for age in value if 0 <= age <= 17]


class SearchFilter(BaseModel):
    """Constraints parsed from a Polish query. The model never picks places."""

    model_config = ConfigDict(extra="ignore")

    date: DateType | None = None
    day_of_week: int | None = Field(default=None, ge=0, le=6)
    time_budget_minutes: int | None = Field(default=None, ge=1, le=24 * 60)
    group: SearchGroup = Field(default_factory=SearchGroup)
    max_price_level: int | None = Field(default=None, ge=0, le=3)
    price_strict: bool = False
    setting: SettingPreference = SettingPreference.EITHER
    setting_strict: bool = False
    interests: list[PlaceCategory] = Field(default_factory=list)
    city: str | None = None
    stop_count: int | None = Field(default=None, ge=1, le=10)

    @model_validator(mode="after")
    def _sync(self) -> SearchFilter:
        if self.group.child_ages and self.group.children < len(self.group.child_ages):
            self.group.children = len(self.group.child_ages)
        if self.group.adults < 1:
            self.group.adults = 1
        if self.date is not None and self.day_of_week is None:
            self.day_of_week = self.date.weekday()
        return self


class SearchUserPreferences(BaseModel):
    """Opcjonalne preferencje z onboardingu (kategorie, profil, ograniczenia)."""

    model_config = ConfigDict(extra="ignore")

    persona: Persona | None = None
    interest_tag_ids: list[str] = Field(default_factory=list)
    profile: UserProfile | None = None
    constraints: UserConstraints | None = None


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)
    limit: int = Field(default=15, ge=1, le=30)
    user_preferences: SearchUserPreferences | None = None

    @field_validator("query", mode="before")
    @classmethod
    def _strip_query(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class SearchResultFlag(StrEnum):
    PRICE_UNCONFIRMED = "price_unconfirmed"
    CHECK_HOURS = "check_hours"


class SearchResult(BaseModel):
    kind: Literal["place", "event"]
    id: int
    name: str
    category: str | None = None
    city: str | None = None
    score: float
    reason: str | None = None
    flags: list[SearchResultFlag] = Field(default_factory=list)
    price_level: int | None = None
    is_indoor: bool = False
    is_outdoor: bool = False
    typical_visit_minutes: int | None = None
    address_line: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    start_date: DateType | None = None
    start_time: str | None = None
    venue_name: str | None = None
    description: str | None = None


class SearchResponse(BaseModel):
    query: str
    summary: str
    filter: SearchFilter
    parser: Literal["llm", "rules"]
    weather_used: bool = False
    weather_raining: bool = False
    weather_note: str | None = None
    results: list[SearchResult] = Field(default_factory=list)


def nullable(schema: dict[str, object]) -> dict[str, object]:
    return {"anyOf": [schema, {"type": "null"}]}


def search_filter_json_schema() -> dict[str, object]:
    categories = [item.value for item in PlaceCategory]
    return {
        "type": "object",
        "additionalProperties": False,
        "required": [
            "date",
            "day_of_week",
            "time_budget_minutes",
            "adults",
            "children",
            "child_ages",
            "max_price_level",
            "price_strict",
            "setting",
            "setting_strict",
            "interests",
            "city",
            "stop_count",
        ],
        "properties": {
            "date": nullable({"type": "string"}),
            "day_of_week": nullable({"type": "integer"}),
            "time_budget_minutes": nullable({"type": "integer"}),
            "adults": {"type": "integer"},
            "children": {"type": "integer"},
            "child_ages": {"type": "array", "items": {"type": "integer"}},
            "max_price_level": nullable({"type": "integer"}),
            "price_strict": {"type": "boolean"},
            "setting": {
                "type": "string",
                "enum": [item.value for item in SettingPreference],
            },
            "setting_strict": {"type": "boolean"},
            "interests": {
                "type": "array",
                "items": {"type": "string", "enum": categories},
            },
            "city": nullable({"type": "string"}),
            "stop_count": nullable({"type": "integer"}),
        },
    }


SEARCH_REASONS_JSON_SCHEMA: dict[str, object] = {
    "type": "object",
    "additionalProperties": False,
    "required": ["items"],
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["kind", "id", "reason"],
                "properties": {
                    "kind": {"type": "string", "enum": ["place", "event"]},
                    "id": {"type": "integer"},
                    "reason": {"type": "string"},
                },
            },
        },
    },
}
