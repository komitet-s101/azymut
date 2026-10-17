# M2 — Public catalog API

Exit criteria from [MASTER-PLAN.md](../MASTER-PLAN.md).

## Checklist

- [x] `GET /api/v1/places`, `GET /api/v1/places/{id}` — filters: budget, duration, opening window; GPS `lat`/`lon`, optional `radius_km`, `sort=distance|name` ([location-gps-design.md](../design/location-gps-design.md))
- [x] `GET /api/v1/routes`, `GET /api/v1/routes/{id}` — stops ordered by `sequence`; optional geo on list
- [x] `GET /api/v1/interest-packages` — static JSON from `data/interest-packages.json` (stable path via `INTEREST_PACKAGES_PATH`)
- [x] Service layer: [src/backend/services/catalog.py](../../../src/backend/services/catalog.py)
- [x] Integration tests: [tests/test_catalog_api.py](../../../tests/test_catalog_api.py)
- [x] OpenAPI at `/docs` (FastAPI auto-schema)

## Setup

Requires M1 catalog seed for manual exploration:

```bash
cd backend
uv sync
uv run tortoise migrate
uv run backend-seed
```

## Verify

```bash
uv run pytest
uv run backend
# http://127.0.0.1:8000/docs
# Try: GET /api/v1/places?city=Sierpc&budget_max_pln=50
# Try: GET /api/v1/places?lat=52.85&lon=19.67&radius_km=15
```

Expected: all tests pass; OpenAPI lists `places`, `routes`, and `interest-packages` tags.
