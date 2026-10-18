# Search results — plan hero summary (lead line)

**Status:** approved (2026-10-18)  
**Problem:** Pod tytułem „Twój plan na dziś” przy długich zapytaniach NL widać chipy profilu (`3 godziny · piątek · na świeżym powietrzu · Płock`) zamiast intencji użytkownika.  
**Wybrany UX (opcja B):** skrót zapytania + chipy **tylko z tekstu** zapytania (bez onboardingu).

## Kontekst

- Frontend: `PlanResultsHeader` → `lead` = `SearchResponse.summary` (`SearchResultsPage`).
- Pełne zapytanie zostaje w `SearchQueryCallout` — bez zmian.
- Ranking używa `SearchFilter` po `merge_user_preferences` — bez zmian w tej iteracji.

## Zachowanie `summary`

| Tryb | Lead |
|------|------|
| `venue_focus` (wzmocnione trafienie nazwy obiektu) | Do 3 nazw wyników — jak dziś (test: wieża ciśnień). |
| Wyszukiwanie NL | `query_excerpt` (≤120 znaków, granica słowa, `…`) opcjonalnie ` · ` + `summarize_filter(explicit_constraints)` |

### Jawne ograniczenia (chipy)

Źródło: reguły na **surowym** `request.query` (nie `llm_query` z suffixem onboardingu).

- Dozwolone: czas, dzień/data, outdoor/indoor z tekstu, cena, dzieci, miasto tylko gdy `_city` trafi.
- Wykluczone: `merge_user_preferences` (czas z constraints, outdoor z profilu, Płock ze `tourist_geography_scope`), domyślne miasto z `apply_search_defaults`.

### Fallback

Gdy brak skrótu i chipów: `Propozycje na Twój czas`.

## Implementacja

| Plik | Zmiana |
|------|--------|
| `backend/src/backend/llm/query_parser.py` | `query_excerpt`, `explicit_search_filter_for_summary` |
| `backend/src/backend/services/search.py` | `summarize_search_response` → składanie leadu B; przekazanie `today` |
| `backend/tests/` | API + unit: brak outdoor z profilu w leadzie; fragment zapytania obecny |

## Poza zakresem (faza 2)

- LLM na czystym `query`, prefs w system prompt (mniej błędów JSON przy długich tekstach).
- Deduplikacja chipów już obecnych w skrócie.

## Test plan

1. POST `/api/v1/search` — długie zapytanie bez outdoor w tekście + `prefer_outdoor: true` → summary bez „świeżym powietrzu”, z fragmentem zapytania.
2. Istniejący test wieży ciśnień — bez regresji.
3. Unit `query_excerpt` / explicit filter — brak Płocka bez nazwy miasta w zapytaniu.
