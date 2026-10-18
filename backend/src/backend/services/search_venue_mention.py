from __future__ import annotations

import re

from backend.db.models import Event, Place
from backend.llm.query_parser import fold

_STRONG_MENTION_SCORE = 12.0
_NAME_TOKEN_BONUS = 3.5
_PHRASE_BONUS = 10.0
_ALIAS_BONUS = 16.0

_STOP_WORDS = frozenset(
    {
        "a",
        "aby",
        "ale",
        "bardzo",
        "bez",
        "bo",
        "by",
        "chce",
        "chcial",
        "chcialbym",
        "chcemy",
        "cos",
        "czy",
        "dla",
        "do",
        "dzis",
        "gdzie",
        "godzin",
        "godziny",
        "i",
        "jak",
        "jakas",
        "jakis",
        "jakis",
        "jest",
        "jestem",
        "jutro",
        "konkretnie",
        "mam",
        "mi",
        "mnie",
        "na",
        "najlepiej",
        "nie",
        "o",
        "od",
        "oraz",
        "plock",
        "plocku",
        "po",
        "pod",
        "pojsc",
        "pokaz",
        "poszukac",
        "prosze",
        "sobote",
        "soboty",
        "tak",
        "tez",
        "to",
        "w",
        "we",
        "weekend",
        "wolne",
        "z",
        "zobaczyc",
        "zobaczyc",
        "zwiedzic",
    }
)

# Zapytanie użytkownika → fragmenty nazwy w katalogu (po fold).
_VENUE_ALIASES: tuple[tuple[re.Pattern[str], tuple[str, ...]], ...] = (
    (
        re.compile(
            r"wiez\w*\s+cisn|wierz\w*\s+cisn|cisnien\w*|cisnieniow\w*|wiez\w*\s+cisnien"
        ),
        ("wieza cisnien", "cisnien"),
    ),
    (
        re.compile(r"\bkatedr\w*|\bbazylik\w*"),
        ("bazylika katedral", "katedral"),
    ),
    (
        re.compile(r"\bkosciol\w*|\bfar\w*\b|\bsanktuari\w*|\bcerkwi\w*"),
        ("kosciol", "fara", "bazylika", "sanktuarium", "cerkiew"),
    ),
    (re.compile(r"\bzoo\b|zoologicz"), ("zoo", "zoologicz")),
    (re.compile(r"\bmuzeum\b"), ("muzeum",)),
    (re.compile(r"\bmolo\b"), ("molo",)),
    (re.compile(r"tumsk\w*|wgórze tumsk|wzgórze tumsk"), ("tumsk", "wgórze tumsk")),
)

_INTEREST_STEMS = frozenset(
    {
        "muzeum",
        "zabytek",
        "histori",
        "kosciol",
        "katedr",
        "koncert",
        "mecz",
        "kibic",
        "basen",
        "sport",
        "spacer",
        "park",
        "zoo",
        "kino",
        "teatr",
        "restaurac",
        "jedzen",
        "sauna",
        "spa",
        "relaks",
        "festiwal",
        "warsztat",
    }
)


def strong_mention_threshold() -> float:
    return _STRONG_MENTION_SCORE


def _searchable_place(place: Place) -> str:
    parts = [place.name or "", place.tags or "", place.description or ""]
    return fold(" ".join(parts))


def _searchable_event(event: Event) -> str:
    parts = [event.name or "", event.venue_name or "", event.description or ""]
    return fold(" ".join(parts))


def _query_tokens(query: str) -> list[str]:
    words = re.findall(r"[a-z0-9]+", fold(query))
    return [word for word in words if len(word) >= 3 and word not in _STOP_WORDS]


def _alias_bonus(query: str, haystack: str) -> float:
    text = fold(query)
    score = 0.0
    for pattern, needles in _VENUE_ALIASES:
        if not pattern.search(text):
            continue
        for needle in needles:
            folded_needle = fold(needle)
            if folded_needle in haystack or folded_needle in text:
                score = max(score, _ALIAS_BONUS)
                break
    return score


def _token_bonus(tokens: list[str], haystack: str, name: str) -> float:
    if not tokens:
        return 0.0
    name_fold = fold(name)
    score = 0.0
    for token in tokens:
        if token in _INTEREST_STEMS:
            continue
        if token in name_fold:
            score += _NAME_TOKEN_BONUS
        elif token in haystack:
            score += _NAME_TOKEN_BONUS * 0.45
    return score


def _phrase_bonus(query: str, name: str) -> float:
    text = fold(query)
    name_fold = fold(name)
    words = [w for w in re.findall(r"[a-z0-9]+", text) if len(w) >= 3 and w not in _STOP_WORDS]
    if len(words) < 2:
        return 0.0
    for width in range(min(5, len(words)), 1, -1):
        for start in range(len(words) - width + 1):
            phrase = " ".join(words[start : start + width])
            if len(phrase) < 7:
                continue
            if phrase in name_fold:
                return _PHRASE_BONUS + width
    return 0.0


def _score_text(query: str, name: str, haystack: str) -> float:
    tokens = _query_tokens(query)
    return (
        _alias_bonus(query, haystack)
        + _phrase_bonus(query, name)
        + _token_bonus(tokens, haystack, name)
    )


def mention_scores_for_catalog(
    query: str,
    places: list[Place],
    events: list[Event],
) -> dict[str, float]:
    if not query.strip():
        return {}
    scores: dict[str, float] = {}
    for place in places:
        key = f"place:{place.id}"
        name = place.name or ""
        haystack = _searchable_place(place)
        value = _score_text(query, name, haystack)
        if value > 0:
            scores[key] = value
    for event in events:
        key = f"event:{event.id}"
        name = event.name or ""
        haystack = _searchable_event(event)
        value = _score_text(query, name, haystack)
        if value > 0:
            scores[key] = value
    return scores


def strong_mention_keys(scores: dict[str, float]) -> set[str]:
    return {key for key, value in scores.items() if value >= _STRONG_MENTION_SCORE}


def venue_focus_keys(scores: dict[str, float]) -> set[str]:
    """Tryb „konkretny obiekt” tylko przy ≤3 mocnych trafieniach (nie cała kategoria)."""
    pinned = strong_mention_keys(scores)
    if not pinned or len(pinned) > 3:
        return set()
    return pinned
