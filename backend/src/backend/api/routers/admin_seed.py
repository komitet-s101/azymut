from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException

from backend.seed import SEED_PATH, seed_from_data

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/seed")
async def admin_run_seed() -> dict[str, str]:
    if not SEED_PATH.is_file():
        raise HTTPException(status_code=500, detail="Seed file missing")
    payload = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    await seed_from_data(payload, force=False)
    return {"status": "ok"}
