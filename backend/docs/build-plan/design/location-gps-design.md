# User location and “nearby” (GPS) — hackathon MVP

Use device **GPS** to sort and promote **close** catalog items when **browsing** and when **generating a plan**. Fits [scope.md](../../scope.md) (“lokalizacja”) and [catalog-db-design.md](catalog-db-design.md) (`latitude`, `longitude` on `Place`).

**Browse API (M2):** Haversine in [src/backend/services/catalog.py](../../../src/backend/services/catalog.py); query params on `GET /api/v1/places` and `GET /api/v1/routes` as below. **Plan boost (M4):** not implemented yet.

## Goal

| Moment | Behavior |
|--------|----------|
| **Browse** | List/map “Near me” — places (and optionally route start points) within radius, sorted by distance |
| **Plan** | `POST /api/v1/plan` uses location to **boost** nearby candidates in LLM context and ordering; Polish copy may mention distance |

## Approaches

| # | Approach | Pros | Cons |
|---|----------|------|------|
| **A. Server distance (recommended)** | Client sends `lat`, `lon`; API computes Haversine, filter/sort | One logic; works for admin seed anywhere | Coords in request (privacy UX) |
| B. Client-only sort | API returns city batch; phone sorts | No coords on server | Duplicated logic; weak for planner |
| C. Map tile / geospatial DB | PostGIS, spatial index | Scales huge regions | Overkill for hackathon SQLite |

**Choice:** **A** — Haversine in `catalog` service; no schema change required.

## Privacy and consent (MVP)

- **Opt-in:** First use shows PL copy; `navigator.geolocation` only after tap (“Użyj mojej lokalizacji”).
- **Storage:** Save last position in **localStorage** with timestamp; refresh on app open or “Odśwież lokalizację” (max age e.g. 30 min for browse).
- **Server:** Do **not** persist user coordinates in SQLite; optional ephemeral use in request logs **off** by default.
- **Fallback:** If GPS denied → filter by `city` / `gmina` from persona or manual picker (Sierpc, Gostynin); plan still works without distance boost.

## Client model extension

Add to `UserContext` ([user-persona-llm-design.md](user-persona-llm-design.md)):

```json
{
  "location": {
    "lat": 52.856,
    "lon": 19.669,
    "accuracy_m": 120,
    "captured_at": "2026-10-17T12:00:00+02:00",
    "source": "gps"
  },
  "location_preferences": {
    "max_radius_km": 15,
    "prefer_nearby": true
  }
}
```

`source`: `gps` | `manual_city` | `null` (no boost).

## API changes

### `GET /api/v1/places`

| Param | Type | Notes |
|-------|------|--------|
| `lat`, `lon` | float | User position; required together for distance mode |
| `radius_km` | float | Default **15**; omit to only sort, not filter |
| `sort` | string | `distance` \| `name` (default `distance` when lat/lon set) |

**Response** — add per item when lat/lon provided:

```json
{
  "place_id": 12,
  "distance_km": 1.3,
  "distance_label": "1.3 km",
  ...
}
```

`distance_label` for Polish UI (“800 m” if &lt; 1 km). Computed server-side.

Filter: `distance_km <= radius_km` when radius provided.

### `GET /api/v1/routes` (optional MVP)

Distance to **first stop** place (or route centroid later). Field `distance_to_start_km` for sorting “trasy blisko”.

### `POST /api/v1/plan`

Body may include `location` + `location_preferences` (same shape as above).

Backend:

1. Recompute `distance_km` on each **place candidate** before LLM.
2. Pre-sort candidates by distance (secondary key after hard filters).
3. Inject into user message:

```json
"proximity_hint": "Preferuj miejsca z niższym distance_km gdy użytkownik prefer_nearby=true; nie wykluczaj dalekich jeśli znacznie lepiej pasują do pakietu lub pogody."
```

4. Cap still 15 places — but **nearest first** in `CANDIDATES` list order (implicit signal for Bielik).

Update [llm-system-prompt-spec.md](llm-system-prompt-spec.md) `system_core` bullet (when implementing prompts):

- Jeśli w kandydatach jest `distance_km`, uwzględnij bliskość przy remisie; w `reason` możesz podać odległość po polsku.

### Slim candidate field

Add to place candidates in [llm-bielik-integration-design.md](llm-bielik-integration-design.md):

```json
"distance_km": 2.1
```

Omitted when no user location in request.

## React UX (mobile)

| Screen | Behavior |
|--------|----------|
| **Home / catalog** | Toggle or chip “W pobliżu”; request GPS; list sorted with distance badge |
| **Map** | Center on user + place pins; highlight &lt; 2 km |
| **Plan wizard** | Checkbox “Preferuj bliskie miejsca” (default on if GPS on) |
| **Plan result** | Show distance per step from catalog enrichment (`distance_km` computed at plan time) |

**Promote nearby:** Section “Blisko Ciebie” (top 5) above full catalog when GPS available.

No turn-by-turn navigation in MVP — external “Navigate” opens Google/OSM with place coords.

## Distance implementation (backend)

```text
haversine_km(lat1, lon1, lat2, lon2) -> float
```

Use place `latitude`/`longitude`. Index not required for ~100 rows; add later if needed.

**Routes:** `distance_to_start_km` = Haversine(user, first `RouteStop` place).

## Alignment with personas

| Persona | Nearby |
|---------|--------|
| **Resident** | Strong — “coś blisko domu” |
| **Tourist** | Medium — promote stops near user **or** near city center if GPS is at hotel; still prioritize **PredefinedRoute** per tourist rules |

If tourist and GPS far from all route starts, still show route but LLM may note dojazd in `tips`.

## Out of scope (MVP)

- Background geolocation / geofencing  
- Storing user location history on server  
- Real-time rerouting while walking  
- Geocoding address search (optional later)

## Testing

| Case | Expected |
|------|----------|
| lat/lon + sort=distance | Ascending `distance_km` |
| radius_km=5 | Excludes far places |
| Plan without location | Same as today; no `distance_km` in candidates |
| GPS denied | City-only browse |

## Decisions

1. GPS for **browse + plan** (user choice).  
2. **Server-side** Haversine; fields on API responses and candidates.  
3. **Opt-in** geolocation; city fallback.  
4. **Promotion** = sort order + LLM hint + UI badges, not a separate DB table.

## Related docs to update at implementation

- [api-admin-design.md](api-admin-design.md) — query params and `PlanRequest`  
- [user-persona-llm-design.md](user-persona-llm-design.md) — `location` block  
- [llm-bielik-integration-design.md](llm-bielik-integration-design.md) — candidate shape  
- [llm-system-prompt-spec.md](llm-system-prompt-spec.md) — one proximity rule  
- [MASTER-PLAN.md](../MASTER-PLAN.md) — M2/M5 tasks  

## Next step

Review this spec; if approved, fold API deltas into `api-admin-design.md` during build. **No code until explicitly requested.**
