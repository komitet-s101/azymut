from __future__ import annotations

import re

from backend.db.models import Event
from backend.llm.query_parser import fold
from backend.services.search_rank import ScoreInput

_VENUE_PLACE_RE = re.compile(
    r"sala koncertow\w*|sala widowiskow\w*|amfiteatr|klub muzyczn\w*|"
    r"zajecia wokaln\w*|o[sś]rodek kultury.*sala",
)
_CONCERT_QUERY_RE = re.compile(r"\bkoncert\w*\b")
_KINO_QUERY_RE = re.compile(r"\b(kino\w*|film\w*)\b")
_MECZ_QUERY_RE = re.compile(r"\b(mecz\w*|kibic\w*)\b")


def venue_place_penalty(place_name: str, *, event_intent: bool) -> float:
    if not event_intent:
        return 0.0
    if _VENUE_PLACE_RE.search(fold(place_name)):
        return 6.0
    return 0.0


def event_name_boost(event_name: str, query: str) -> float:
    text = fold(query)
    name = fold(event_name)
    boost = 0.0
    for token in re.findall(r"[a-z0-9]+", text):
        if len(token) < 4:
            continue
        if token in name:
            boost += 2.0
    return min(boost, 6.0)


def filter_events_for_query(events: list[Event], query: str) -> list[Event]:
    text = fold(query)
    if _CONCERT_QUERY_RE.search(text) and not _KINO_QUERY_RE.search(text):
        narrowed = [
            event
            for event in events
            if (event.category or "") == "muzyka_widowiska"
            or "koncert" in fold(event.name)
        ]
        if narrowed:
            return narrowed
    if _KINO_QUERY_RE.search(text):
        narrowed = [
            event
            for event in events
            if (event.category or "") == "kultura_sztuka_film"
            and "kino" in fold(event.name)
        ]
        if narrowed:
            return narrowed
    if _MECZ_QUERY_RE.search(text):
        narrowed = [
            event
            for event in events
            if (event.category or "") == "kibicowanie_wydarzenia_sportowe"
            or event.sport
        ]
        if narrowed:
            return narrowed
    return events


def prioritize_event_results(
    ranked: list[tuple[ScoreInput, float]],
    *,
    limit: int,
    event_intent: bool,
) -> list[tuple[ScoreInput, float]]:
    if not event_intent:
        return ranked[:limit]
    events = [pair for pair in ranked if pair[0].kind == "event"]
    places = [pair for pair in ranked if pair[0].kind == "place"]
    if not events:
        return ranked[:limit]
    events.sort(key=lambda pair: (-pair[1], pair[0].key))
    places.sort(key=lambda pair: (-pair[1], pair[0].key))
    event_cap = min(len(events), max(3, limit // 2))
    merged = events[:event_cap] + places[: max(0, limit - event_cap)]
    if len(merged) < limit:
        merged.extend(events[event_cap : event_cap + limit - len(merged)])
    if len(merged) < limit:
        used_place = min(len(places), max(0, limit - event_cap))
        merged.extend(places[used_place : used_place + limit - len(merged)])
    return merged[:limit]
