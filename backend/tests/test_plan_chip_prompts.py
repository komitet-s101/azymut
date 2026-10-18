"""Chipy planu (explicit_search_filter_for_summary + summarize_filter) dla 20 zapytań NL."""

from __future__ import annotations

from datetime import date

import pytest

from backend.llm.query_parser import explicit_search_filter_for_summary, query_excerpt
from backend.services.search import summarize_filter, summarize_search_response

TODAY = date(2026, 10, 17)  # piątek


def _chips(query: str) -> str:
    filt = explicit_search_filter_for_summary(query, today=TODAY)
    text = summarize_filter(filt)
    return text if text != "Propozycje na Twój czas" else ""


def _lead(query: str) -> str:
    filt = explicit_search_filter_for_summary(query, today=TODAY)
    return summarize_search_response(query, filt, [], venue_focus=False, today=TODAY)


PLAN_CHIP_CASES: list[tuple[str, str]] = [
    (
        "mam wolne 3 godziny w sobotę, jestem z dwójką dzieci i chcę coś bezpłatnego, najlepiej na świeżym powietrzu",
        "3 godziny · sobota · 2 dzieci · bezpłatne · na świeżym powietrzu",
    ),
    (
        "szukam darmowej atrakcji dla dzieci w plocku na niedziele",
        "niedziela · 2 dzieci · bezpłatne · Płock",
    ),
    (
        "cos w domu jak pada, 2h, bez dzieci",
        "2 godziny · pod dachem",
    ),
    (
        "chce isc na basen w piatek z zona",
        "piątek",
    ),
    (
        "restauracja na dzis wieczorem, budzet do 80 zl, dwie osoby",
        "sobota",  # TODAY=2026-10-17 jest sobotą; budżet 80 zł nie wchodzi do chipów (tylko free/tanio)
    ),
    (
        "spacer po plocku z wozkiem, najlepiej za darmo",
        "1 dziecko · najlepiej bezpłatne · na świeżym powietrzu · Płock",
    ),
    (
        "muzeum w sobote, max 90 minut, dorosli",
        "90 min · sobota",
    ),
    (
        "kino z dzieckiem 8 lat w niedziele",
        "niedziela · 1 dziecko",
    ),
    (
        "boisko albo orlik, sport, 1 godzina",
        "1 godzina",
    ),
    (
        "cos na swiezym powietrzu w wyszogrodzie",
        "na świeżym powietrzu · Wyszogród",
    ),
    (
        "festiwal albo koncert w ten weekend",
        "sobota",
    ),
    (
        "sauna tylko dla doroslych, w srode",
        "środa",
    ),
    (
        "tanie jedzenie po pracy w plocku",
        "tanio · Płock",
    ),
    (
        "park linowy dla 5-latka, pogodnie",
        "1 dziecko",
    ),
    (
        "nie chce placic, 4 godziny, dwojka dzieci 4 i 7 lat, plac zabaw",
        "4 godziny · 2 dzieci · bezpłatne",
    ),
    (
        "wycieczka do zoo jutro",
        "niedziela",
    ),
    (
        "cos pod dachem bo bedzie deszcz, rodzinnie",
        "1 dziecko · pod dachem",
    ),
    (
        "historia i zabytki, spokojnie, bez pospiechu, 2 osoby",
        "",
    ),
    (
        "mecz w sobote",
        "sobota",
    ),
    (
        "warsztaty ceramiczne dla dzieci w gostyninie",
        "2 dzieci · Gostynin",
    ),
]


@pytest.mark.parametrize(
    "query,expected_chips",
    PLAN_CHIP_CASES,
    ids=[pair[0][:48] for pair in PLAN_CHIP_CASES],
)
def test_explicit_plan_chips(query: str, expected_chips: str) -> None:
    assert _chips(query) == expected_chips


def test_print_plan_chip_matrix() -> None:
    """Podgląd: pytest tests/test_plan_chip_prompts.py -k print_plan_chip_matrix -s"""
    lines = [f"{'ZAPYTANIE':<50} | CHIPY", "-" * 100]
    for query, _expected in PLAN_CHIP_CASES:
        chips = _chips(query) or "(brak)"
        lead = _lead(query)
        lines.append(f"{query[:48]:<50} | {chips}")
        lines.append(f"  lead: {lead[:95]}")
    print("\n".join(lines))
    assert len(PLAN_CHIP_CASES) == 20


@pytest.mark.parametrize(
    "query,expected_chips",
    PLAN_CHIP_CASES,
    ids=[f"lead-{pair[0][:40]}" for pair in PLAN_CHIP_CASES],
)
def test_plan_lead_contains_excerpt_and_chips(query: str, expected_chips: str) -> None:
    lead = _lead(query)
    excerpt = query_excerpt(query)
    if excerpt:
        assert excerpt in lead or excerpt.rstrip("…") in lead
    if expected_chips:
        for part in expected_chips.split(" · "):
            assert part in lead
