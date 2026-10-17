from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, Field

from backend.db.models import PriceLevel


class OpeningHoursIn(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    opens_at: str = Field(pattern=r"^\d{2}:\d{2}$")
    closes_at: str = Field(pattern=r"^\d{2}:\d{2}$")


class PlaceCreate(BaseModel):
    name: str
    description: str | None = None
    city: str
    gmina: str
    address_line: str | None = None
    latitude: float
    longitude: float
    category: str
    is_indoor: bool
    is_outdoor: bool
    adult_only: bool = False
    min_age_recommended: int | None = None
    typical_visit_minutes: int
    price_level: PriceLevel
    price_max_pln: Decimal | None = None
    gastro_intensity: int = Field(default=0, ge=0, le=5)
    game_interactivity: int = Field(default=0, ge=0, le=5)
    physical_activity_level: int = Field(default=0, ge=0, le=5)
    cultural_education: int = Field(default=0, ge=0, le=5)
    nature_relaxation: int = Field(default=0, ge=0, le=5)
    family_friendly: int = Field(default=0, ge=0, le=5)
    rain_suitable: int = Field(default=0, ge=0, le=5)


class PlaceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    city: str | None = None
    gmina: str | None = None
    address_line: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    category: str | None = None
    is_indoor: bool | None = None
    is_outdoor: bool | None = None
    adult_only: bool | None = None
    min_age_recommended: int | None = None
    typical_visit_minutes: int | None = None
    price_level: PriceLevel | None = None
    price_max_pln: Decimal | None = None
    gastro_intensity: int | None = Field(default=None, ge=0, le=5)
    game_interactivity: int | None = Field(default=None, ge=0, le=5)
    physical_activity_level: int | None = Field(default=None, ge=0, le=5)
    cultural_education: int | None = Field(default=None, ge=0, le=5)
    nature_relaxation: int | None = Field(default=None, ge=0, le=5)
    family_friendly: int | None = Field(default=None, ge=0, le=5)
    rain_suitable: int | None = Field(default=None, ge=0, le=5)


class RouteCreate(BaseModel):
    name: str
    description: str | None = None
    duration_minutes_approx: int
    stops_min: int
    stops_max: int
    city: str
    gmina: str
    price_level_max: PriceLevel | None = None


class RouteUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    duration_minutes_approx: int | None = None
    stops_min: int | None = None
    stops_max: int | None = None
    city: str | None = None
    gmina: str | None = None
    price_level_max: PriceLevel | None = None


class RouteStopIn(BaseModel):
    place_id: int
    sequence: int
    dwell_minutes: int | None = None


class RouteStopsReplace(BaseModel):
    stops: list[RouteStopIn]
