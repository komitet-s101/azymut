from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from backend.api.schemas.search import SearchResult, SearchUserPreferences


class HomeUpcomingEventsRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    limit: int = Field(default=4, ge=1, le=12)
    user_preferences: SearchUserPreferences | None = None


class HomeUpcomingEventsResponse(BaseModel):
    events: list[SearchResult] = Field(default_factory=list)


class HomeRecommendedPlacesRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    limit: int = Field(default=6, ge=1, le=12)
    user_preferences: SearchUserPreferences | None = None


class HomeRecommendedPlacesResponse(BaseModel):
    places: list[SearchResult] = Field(default_factory=list)
