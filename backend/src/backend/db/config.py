from __future__ import annotations

from pathlib import Path
from typing import Any

BACKEND_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = BACKEND_ROOT / "data"
DB_DIR = DATA_DIR
DB_PATH = DB_DIR / "backend.db"
INTEREST_PACKAGES_PATH = DATA_DIR / "interest-packages.json"
SEED_CSV_DIR = DATA_DIR / "csv_seed"


def build_tortoise_orm(db_path: Path | None = None) -> dict[str, Any]:
    path = db_path if db_path is not None else DB_PATH
    return {
        "connections": {
            "default": f"sqlite://{path}",
        },
        "apps": {
            "models": {
                "models": ["backend.db.models"],
                "default_connection": "default",
                "migrations": "backend.db.migrations",
            },
        },
    }


TORTOISE_ORM = build_tortoise_orm()
