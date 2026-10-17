# Onboarding — design & mapowanie na model danych

**Status:** zaimplementowany mock UI (2026-10-17)  
**Persistence:** `localStorage` klucz `azymut_user_context_v1` — brak tabeli User w bazie (MVP).

## Ekrany (wireframe → implementacja)

| Krok | Wireframe | Implementacja |
|------|-----------|---------------|
| 1 | Mieszkaniec / Turysta | `PersonaStep` → `persona` |
| 2 | Tagi zainteresowań (multi) | `InterestsStep` → `interest_tag_ids` + `interest_package_id` |
| 3 | Wiek (+ „Mam dzieci” od 18 lat) | `ProfileStep` → `age`, opcjonalnie `hasChildren` → `constraints.party`, `profile.prefer_outdoor` |

Stopka (przypięta do dołu ekranu): informacja o lokalnym przechowywaniu preferencji, personalizacji przez AI oraz link do polityki prywatności (`OnboardingPrivacyFooter`).

## Porównanie z backendem (`UserContext` / `POST /api/v1/plan`)

Źródło prawdy API: [`backend/src/backend/api/schemas/plan.py`](../../backend/src/backend/api/schemas/plan.py).

| Pole API | W bazie SQLite? | Zbierane w onboardingu? | Uwagi |
|----------|-----------------|-------------------------|--------|
| `persona` | Nie (klient) | **Tak** — krok 1 | `tourist` \| `resident` |
| `interest_package_id` | Nie — plik `interest-packages.json` | **Tak** — wynik tagów krok 2 | `GET /api/v1/interest-packages` — 4 pakiety w repo |
| `custom_request` | Nie | Nie (home / search) | NL później |
| `constraints.budget_max_pln` | Nie | Domyślnie `0` | Ustawienia / planner |
| `constraints.available_minutes` | Nie | Domyślnie `180` | Ustawienia |
| `constraints.day_of_week` | Nie | Auto (dziś) | |
| `constraints.window_start/end` | Nie | Domyślnie `10:00`–`18:00` | |
| `constraints.party.adults` | Nie | Domyślnie `1` | Bez pytania w UI |
| `constraints.party.kids_ages` | Nie | **Tak** — tylko „Mam dzieci” (≥18 lat); jeden placeholder `[8]` | Bez liczby dzieci w UI |
| `profile.likes_games` | Nie | Częściowo — tagi (Gry, Rodzinnie…) | 0–5 |
| `profile.prefer_outdoor` | Nie | **Tak** — przełącznik krok 3 | |
| `profile.physical_activity_preference` | Nie | Częściowo — tag Sport | 0–5 |
| `profile.gastro_intensity_preference` | Nie | Częściowo — tag Smaki regionu | 0–5 |
| `profile.bmi` | Nie | **Nie** w onboardingu | Opcjonalnie później (scope: BMI / aktywność) |
| `age` | **Brak w API** | **Tak** — krok 3 | Tylko `UserContextLocal.age` na kliencie |

## Pakiety zainteresowań w repo (DB vs JSON)

W SQLite **nie ma** tabeli pakietów — lista w [`backend/data/interest-packages.json`](../../backend/data/interest-packages.json):

- `culture_walk` — Kultura i spacery  
- `family_fun` — Rodzinnie  
- `rainy_day` — Na deszcz  
- `local_flavors` — Smaki regionu (głównie `resident`)

Dokument [`user-persona-llm-design.md`](../../backend/docs/build-plan/design/user-persona-llm-design.md) opisuje szerszy katalog pakietów (np. `game_adrenaline`) — to **roadmapa**; UI onboardingu korzysta z JSON obecnego w API.

## Co jeszcze warto zebrać później (poza onboardingiem)

- Lokalizacja GPS / miasto (`location-gps-design.md`)
- Budżet i okno czasowe na sesję planowania
- Wiek każdego dziecka zamiast liczby
- `bmi`, zaawansowane suwaki profilu (0–5)
- Zmiana persony i pakietu w ustawieniach

## Pliki frontend

- `src/pages/OnboardingPage.tsx`
- `src/components/onboarding/*`
- `src/lib/buildUserContextFromOnboarding.ts`
- `src/lib/userContextStorage.ts`
- `src/types/userContext.ts`
