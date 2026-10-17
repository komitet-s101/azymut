from __future__ import annotations

from dataclasses import dataclass

from backend.services.search_events import filter_events_for_query, venue_place_penalty


@dataclass
class _EventRow:
    id: int
    name: str
    category: str | None
    sport: str | None = None


def test_venue_penalty_for_concert_hall_name() -> None:
    assert venue_place_penalty("Sala koncertowa PSM", event_intent=True) == 6.0
    assert venue_place_penalty("Sala koncertowa PSM", event_intent=False) == 0.0


def test_koncert_query_filters_out_kino_events() -> None:
    events = [
        _EventRow(1, "Kino Maluszka", "kultura_sztuka_film"),
        _EventRow(2, "Koncert „Efekt Chopina”", "muzyka_widowiska"),
    ]
    filtered = filter_events_for_query(events, "koncert")
    assert [event.id for event in filtered] == [2]
