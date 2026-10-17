# Leisure planner backend

FastAPI + Tortoise ORM + SQLite for the hackathon leisure-time planner (Płock and surrounding gminas).

## Setup

```bash
cd backend
uv sync
cp .env.example .env   # optional
uv run tortoise init models          # first time only (migrations package)
uv run tortoise makemigrations       # after model changes
uv run tortoise migrate              # apply migrations (required before seed)
uv run backend-seed                  # load catalog from data/csv_seed/
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

## Natural language search

`POST /api/v1/search` with `{ "query": "mam wolne 3 godziny w sobotę..." }`.

Groq (`openai/gpt-oss-120b`, low reasoning) only parses the sentence into a filter. Ranking is deterministic in Python. Without `GROQ_API_KEY` the same endpoint uses the built-in Polish rules. `SEARCH_LLM_REASONS=true` adds a short Polish reason for the top hits.

```bash
cp .env.example .env   # set GROQ_API_KEY
uv run tortoise migrate && uv run backend-seed
uv run backend
```

## Tests

```bash
uv run pytest
```

## Build plan

Implementation follows [docs/build-plan/MASTER-PLAN.md](docs/build-plan/MASTER-PLAN.md).
