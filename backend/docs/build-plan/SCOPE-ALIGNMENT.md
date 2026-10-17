# Scope alignment verification

Product brief: [scope.md](../scope.md) (Polish). Technical specs: [design/](design/).  
**Verdict:** MVP design set is **consistent** with scope intent for a hackathon; several scope bullets are **explicitly deferred** (documented below). Safe to proceed with [MASTER-PLAN.md](MASTER-PLAN.md).

## Functional mapping

| Scope (scope.md) | Design coverage | MVP status |
|------------------|-----------------|------------|
| Personal plan from interests, location, availability, budget, preferences | [user-persona-llm-design.md](design/user-persona-llm-design.md), [catalog-db-design.md](design/catalog-db-design.md), `POST /plan` | **In** — prefs in localStorage; budget/time filters in API |
| Sierpc / Gostynin, residents + tourists | `city` / `gmina` on Place/Route; `persona` tourist \| resident | **In** |
| Location / what is nearby | [location-gps-design.md](design/location-gps-design.md) — GPS opt-in, distance sort, plan boost | **In** (browse + plan) |
| Natural language (“3h Saturday, kids, free, outdoor”) | `custom_request` + Bielik; interest packages | **In** |
| Plan with hours, map, route, costs, tips | [PlanEnrichedResponse](design/api-admin-design.md); coords from catalog; `price_*` fields | **In** (map = pins + links; not turn-by-turn routing) |
| User profile & remembered preferences | Client `UserContext` localStorage | **In** (no server account) |
| Indoor / outdoor | `is_indoor`, `is_outdoor`, `prefer_outdoor`, `rain_suitable` | **In** |
| Time & budget fit | `typical_visit_minutes`, `price_level`, opening hours | **In** |
| Children’s age | `kids_ages`, `min_age_recommended`, `family_friendly` | **In** |
| Weather | [weather API + planner context](design/api-admin-design.md) | **In** (pluggable provider) |
| Opening hours | `OpeningHours` table + filters | **In** |
| Alternatives when conditions change | `alternatives[]` in plan; rain_suitable | **In** (single alternative in prompt spec) |
| Tourist vs local journeys | Persona + routes vs places | **In** |
| Predefined trips / trails | `PredefinedRoute`, `RouteStop` | **In** |
| LLM / Polish | Bielik remote; [llm-system-prompt-spec.md](design/llm-system-prompt-spec.md) | **In** |
| Admin / catalog maintenance | React admin + `/api/v1/admin/*` | **In** (no auth) |
| Aggregate events from many sources | — | **Deferred** ([catalog-db-design.md](design/catalog-db-design.md) post-MVP `Event`, `DataSource`) |
| Live calendars (theatres, social, portals) | — | **Deferred** — static seed + admin for hackathon |
| Save, modify, share plan on server | — | **Deferred** — optional client sessionStorage only |
| Full “optimal route” between arbitrary points | — | **Partial** — ordered stops on predefined route or plan steps; no external routing engine in MVP |
| Parking, tickets, wheelchair (scope practical info) | — | **Partial** — `price_level` / `price_max_pln`; parking/ticket_url fields deferred in catalog MVP |
| Login / accounts | — | **Out** (by design for hackathon) |

## Cross-document consistency

| Check | Result |
|-------|--------|
| Catalog fields ↔ API query params | OK — [api-admin-design.md](design/api-admin-design.md) mirrors catalog |
| Persona / packages ↔ planner request | OK — `UserContext` + interest packages |
| Planner ↔ Bielik prompts | OK — injection in user message; system in [llm-system-prompt-spec.md](design/llm-system-prompt-spec.md) |
| Plan ids ↔ UI hydration | OK — enricher + catalog GET |
| Metric names (gastro, game, …) | OK — same 0–5 across catalog, packages, prompts |
| Stack: FastAPI + React TS mobile | OK — [api-admin-design.md](design/api-admin-design.md) |

## Intentional MVP cuts (jury talking points)

1. **Data:** Hand-curated SQLite seed + admin, not multi-source scrapers.  
2. **Events:** Places-only catalog; “what’s on Saturday” is LLM + static places unless phase 2 adds `Event`.  
3. **Routing:** Geographic map of plan stops, not OSRM/Google Directions optimization.  
4. **Identity:** No sync across devices; demo on one phone is enough.

## Open items (non-blocking)

- Exact weather provider (`open_meteo` vs custom import).  
- Bielik hosting stack (Ollama vs vLLM) and model tag.  
- Frontend repo path (sibling `frontend/` vs monorepo).

None of these block starting backend catalog + API per master plan.
