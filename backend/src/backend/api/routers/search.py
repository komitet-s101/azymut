from __future__ import annotations

from fastapi import APIRouter

from backend.api.schemas.search import SearchRequest, SearchResponse
from backend.services.search import search_catalog

router = APIRouter(tags=["search"])


@router.post("/search", response_model=SearchResponse)
async def create_search(body: SearchRequest) -> SearchResponse:
    return await search_catalog(body)
