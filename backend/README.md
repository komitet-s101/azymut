# Leisure planner backend

FastAPI + Tortoise ORM + SQLite for the hackathon leisure-time planner (Sierpc / Gostynin).

## Setup

```bash
cd backend
uv sync
cp .env.example .env   # optional
uv run tortoise init models          # first time only (migrations package)
uv run tortoise makemigrations       # after model changes
uv run tortoise migrate              # apply migrations (required before seed)
uv run backend-seed                  # load demo catalog from data/seed/catalog.json
```

Reset catalog to seed file contents (without deleting the DB file):

```bash
uv run tortoise migrate && uv run backend-seed --force
```

Full DB reset:

```bash
rm -f data/backend.db data/backend.db-wal data/backend.db-shm
uv run tortoise migrate && uv run backend-seed
```

## Run API

```bash
uv run backend
# http://127.0.0.1:8000/health
# http://127.0.0.1:8000/docs
```

## Tests

```bash
uv run pytest
```

## Build plan

Implementation follows [docs/build-plan/MASTER-PLAN.md](docs/build-plan/MASTER-PLAN.md).
