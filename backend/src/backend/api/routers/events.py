from __future__ import annotations

from fastapi import APIRouter, Query

from backend.api.schemas.events import EventSummaryOut, PaginatedEvents
from backend.services import catalog

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=PaginatedEvents)
async def list_events(
    upcoming_only: bool = True,
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> PaginatedEvents:
    page, total = await catalog.list_events(
        upcoming_only=upcoming_only,
        limit=limit,
        offset=offset,
    )
    items = [
        EventSummaryOut(
            id=event.id,
            name=event.name,
            start_date=event.start_date,
            start_time=event.start_time,
            city=event.city,
            gmina=event.gmina,
            venue_name=event.venue_name,
            category=event.category,
            price_level=int(event.price_level) if event.price_level is not None else None,
        )
        for event in page
    ]
    return PaginatedEvents(items=items, total=total, limit=limit, offset=offset)
