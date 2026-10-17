from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException

from backend.api.schemas.interest_packages import InterestPackageOut
from backend.db.config import INTEREST_PACKAGES_PATH

router = APIRouter(tags=["interest-packages"])


@router.get("/interest-packages", response_model=list[InterestPackageOut])
async def get_interest_packages() -> list[InterestPackageOut]:
    if not INTEREST_PACKAGES_PATH.is_file():
        raise HTTPException(status_code=404, detail="Interest packages not configured")
    raw = json.loads(INTEREST_PACKAGES_PATH.read_text(encoding="utf-8"))
    return InterestPackageOut.parse_list(raw)
