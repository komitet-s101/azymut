from __future__ import annotations

from pathlib import Path
from typing import Any

from tortoise import Tortoise
from tortoise.migrations.api import migrate

from backend.db.config import build_tortoise_orm


async def init_test_db(db_path: Path) -> dict[str, Any]:
    config = build_tortoise_orm(db_path)
    try:
        await Tortoise.close_connections()
    except Exception:
        pass
    await migrate(config=config)
    await Tortoise.init(config=config)
    return config
