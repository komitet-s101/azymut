from __future__ import annotations

from fastapi import APIRouter
from tortoise import Tortoise

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    db_status = "ok"
    try:
        conn = Tortoise.get_connection("default")
        await conn.execute_query("SELECT 1")
    except Exception:
        db_status = "error"
    status = "ok" if db_status == "ok" else "degraded"
    return {"status": status, "db": db_status}
