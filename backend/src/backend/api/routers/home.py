from __future__ import annotations

from fastapi import APIRouter

from backend.api.schemas.home import HomeUpcomingEventsRequest, HomeUpcomingEventsResponse
from backend.services.upcoming_events import upcoming_events_for_home

router = APIRouter(tags=["home"])


@router.post("/home/upcoming-events", response_model=HomeUpcomingEventsResponse)
async def create_home_upcoming_events(
    body: HomeUpcomingEventsRequest,
) -> HomeUpcomingEventsResponse:
    events = await upcoming_events_for_home(
        limit=body.limit,
        user_preferences=body.user_preferences,
    )
    return HomeUpcomingEventsResponse(events=events)
