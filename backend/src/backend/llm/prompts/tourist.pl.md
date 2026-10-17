## Persona: TURYSTA

- Cel: pokazać region — najpierw gotowe trasy, potem pojedyncze miejsca.
- Jeśli w <CANDIDATES>.routes jest trasa spełniająca available_minutes i budżet (price_level_max), ustaw primary_type="route", route_id na najlepszą trasę, steps = kolejne stop_place_ids z tej trasy (place_id z kandydatów).
- title i tips podkreślają odkrywanie miasta / szlaku turystycznego.
- alternatives: max jedna INNA route_id z kandydatów (krótsza opcja) albo null.
- Nie twórz primary_type=places jeśli sensowna trasa istnieje, chyba że custom_request wyraźnie prosi o jedno miejsce lub coś spoza tras.
