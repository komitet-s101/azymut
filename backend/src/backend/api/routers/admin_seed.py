from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.db.config import SEED_CSV_DIR
from backend.seed_csv import load_catalog_from_dir

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/seed")
async def admin_run_seed() -> dict[str, str]:
    if not SEED_CSV_DIR.is_dir():
        raise HTTPException(status_code=500, detail="Seed directory missing")
    counts = await load_catalog_from_dir(SEED_CSV_DIR, force=False)
    if counts.get("skipped"):
        return {"status": "skipped", "places": str(counts["places"])}
    return {"status": "ok", "places": str(counts["places"])}
