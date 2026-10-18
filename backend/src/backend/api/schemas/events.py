from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field


class EventSummaryOut(BaseModel):
    id: int
    name: str
    start_date: date
    start_time: str | None = None
    city: str | None = None
    gmina: str | None = None
    venue_name: str | None = None
    category: str | None = None
    price_level: int | None = None


class PaginatedEvents(BaseModel):
    items: list[EventSummaryOut] = Field(default_factory=list)
    total: int
    limit: int
    offset: int
