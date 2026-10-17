# M1 — Catalog database and seed

Exit criteria from [MASTER-PLAN.md](../MASTER-PLAN.md).

## Checklist

- [x] Tortoise models: `Place`, `OpeningHours`, `PredefinedRoute`, `RouteStop` ([catalog-db-design.md](../design/catalog-db-design.md))
- [x] Migration `0001_initial` in `src/backend/db/migrations/`
- [x] Seed: `data/csv_seed/` (316 places, 97 routes, events and verification metadata)
- [x] `uv run backend-seed` and `uv run backend-seed --force`
- [x] Automated checks: `tests/test_seed_catalog.py`
- [x] Tests use isolated SQLite (`tests/conftest.py`, `tests/db_helpers.py`)

## Setup

```bash
cd backend
uv sync
uv run tortoise migrate
uv run backend-seed
```

## Verify

```bash
uv run pytest
uv run python -c "
import asyncio
from tortoise import Tortoise
from backend.db.config import TORTOISE_ORM
from backend.db.models import Place, PredefinedRoute

async def main():
    await Tortoise.init(config=TORTOISE_ORM)
    print('places', await Place.all().count())
    print('routes', await PredefinedRoute.all().count())
    await Tortoise.close_connections()
asyncio.run(main())
"
```

Expected: `places 316`, `routes 97` (after `backend-seed --force`).

## Reset catalog

```bash
uv run tortoise migrate && uv run backend-seed --force
```
