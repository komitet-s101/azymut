# M4 — Bielik planner

Exit criteria from [MASTER-PLAN.md](../MASTER-PLAN.md).

## Delivered

- Prompt files under `src/backend/llm/prompts/`
- `assembler.py`, `parser.py`, `client.py`
- `services/catalog_query.py` (5 routes / 15 places cap)
- `services/planner.py`, `services/plan_enricher.py`
- `POST /api/v1/plan` → `PlanEnrichedResponse`
- `PLANNER_STUB` for dev without Bielik; live path via `LLM_BASE_URL`

## Verify

```bash
cd backend && uv run pytest tests/test_plan_api.py tests/test_plan_parser.py -q
```

With `PLANNER_STUB=false`, smoke Bielik: `curl` OpenAI-compatible `/v1/chat/completions` on `LLM_BASE_URL`.
