# M3 — Weather + admin API

Exit criteria from [MASTER-PLAN.md](../MASTER-PLAN.md) (React admin UI deferred).

## Checklist

- [x] `GET /api/v1/weather/current` — `lat`+`lon` or `city` (+ optional `gmina`)
- [x] `GET /api/v1/weather/forecast` — Open-Meteo hourly when `WEATHER_PROVIDER=imgw_inpost`
- [x] Providers: `stub`, `open_meteo`, `imgw_inpost` (IMGW synop + optional InPost air on current)
- [x] Admin CRUD under `/api/v1/admin/*` when `ADMIN_ENABLED=true`
- [x] Tests: `test_weather_api.py`, `test_weather_rules.py`, `test_admin_api.py`

## Environment

```env
WEATHER_PROVIDER=imgw_inpost
WEATHER_CACHE_TTL_SECONDS=300
INPOST_LOCKER_CODE=        # optional
INPOST_LOCKER_ID=          # optional shipx id
INPOST_ENABLED=true
ADMIN_ENABLED=true
```

**Note:** `/weather/current` uses IMGW nearest synop (+ InPost when configured). `/weather/forecast` uses Open-Meteo in `imgw_inpost` mode.

## Verify

```bash
cd backend
uv sync
uv run tortoise migrate
uv run backend-seed
uv run pytest
uv run backend
```

```bash
curl "http://127.0.0.1:8000/api/v1/weather/current?city=Sierpc"
curl "http://127.0.0.1:8000/api/v1/weather/forecast?lat=52.85&lon=19.67&hours=24"
```

With `ADMIN_ENABLED=true`, use `/docs` to `POST /api/v1/admin/places` and confirm `GET /api/v1/places/{id}`.
