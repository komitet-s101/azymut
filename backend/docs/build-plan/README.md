# Build plan — leisure time planner (PROJEKT 6)

| Document | Purpose |
|----------|---------|
| [MASTER-PLAN.md](MASTER-PLAN.md) | **Roadmap and implementation order** (start here) |
| [SCOPE-ALIGNMENT.md](SCOPE-ALIGNMENT.md) | scope.md vs design verification |
| [../scope.md](../scope.md) | Original product brief (Polish) |
| [design/](design/) | Frozen technical specs |

### Design specs

- [catalog-db-design.md](design/catalog-db-design.md) — SQLite schema (4 tables)
- [api-admin-design.md](design/api-admin-design.md) — FastAPI, React, weather, admin API
- [user-persona-llm-design.md](design/user-persona-llm-design.md) — tourist/resident, packages, client storage
- [llm-bielik-integration-design.md](design/llm-bielik-integration-design.md) — remote Bielik, orchestrator, UI enrichment
- [llm-system-prompt-spec.md](design/llm-system-prompt-spec.md) — system/persona/retry prompt text
- [location-gps-design.md](design/location-gps-design.md) — GPS, nearby browse, distance in planner

**Status:** Build in progress — **M0 foundation complete** (backend + frontend scaffold); follow [MASTER-PLAN.md](MASTER-PLAN.md) from M1 onward.
