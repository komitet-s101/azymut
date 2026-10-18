from __future__ import annotations

import pytest

from backend.db.models import Place, PriceLevel
from backend.services.search_venue_mention import (
    mention_scores_for_catalog,
    strong_mention_keys,
    venue_focus_keys,
)


async def _place(name: str, **kwargs: object) -> Place:
    data = {
        "city": "Płock",
        "gmina": "Płock",
        "category": "historia_zabytki",
        "is_indoor": True,
        "is_outdoor": False,
        "typical_visit_minutes": 60,
        "price_level": PriceLevel.FREE,
    }
    data.update(kwargs)
    data["name"] = name
    return await Place.create(**data)


@pytest.mark.anyio
async def test_mention_wieza_cisnien(db) -> None:
    tower = await _place(
        "Wieża Ciśnień – punkt widokowy",
        category="przyroda_spacery_widoki",
    )
    spa = await _place(
        "Aquapark Płock – strefa SPA (sauny, jacuzzi)",
        category="relaks_wypoczynek",
        description="grota lodowa i solna",
    )
    scores = mention_scores_for_catalog(
        "chcę zobaczyć wieżę ciśnień",
        [tower, spa],
        [],
    )
    assert scores[f"place:{tower.id}"] >= 12
    assert f"place:{spa.id}" not in scores or scores[f"place:{spa.id}"] < scores[f"place:{tower.id}"]


@pytest.mark.anyio
async def test_mention_katedra(db) -> None:
    cathedral = await _place(
        "Bazylika Katedralna pw. Wniebowzięcia NMP",
        category="sakralne_wielokulturowosc",
    )
    other = await _place("Muzeum Sztuki Nowoczesnej", category="historia_zabytki")
    scores = mention_scores_for_catalog("katedra w Płocku", [cathedral, other], [])
    assert scores[f"place:{cathedral.id}"] >= 12
    pins = strong_mention_keys(scores)
    assert f"place:{cathedral.id}" in pins
    assert f"place:{cathedral.id}" in venue_focus_keys(scores, "katedra w Płocku")


@pytest.mark.anyio
async def test_mention_molo_single_word_not_every_place(db) -> None:
    molo = await _place(
        "Molo na Wiśle",
        category="przyroda_spacery_widoki",
        is_outdoor=True,
        description="drewniany pomost nad Wisłą",
    )
    other = await _place(
        "Bulwary wiślane",
        category="przyroda_spacery_widoki",
        is_outdoor=True,
        description="spacer bez słowa molo w nazwie",
    )
    scores = mention_scores_for_catalog("molo", [molo, other], [])
    assert scores[f"place:{molo.id}"] >= 12
    assert scores.get(f"place:{other.id}", 0) < 12
    focus = venue_focus_keys(scores, "molo")
    assert focus == {f"place:{molo.id}"}


@pytest.mark.anyio
async def test_venue_focus_off_when_many_generic_muzeum_hits(db) -> None:
    places = [
        await _place("Muzeum Mazowieckie", category="historia_zabytki"),
        await _place("Muzeum Sztuki Nowoczesnej", category="historia_zabytki"),
        await _place("Muzeum Diecezjalne", category="historia_zabytki"),
        await _place("Muzeum Rzeźby", category="historia_zabytki"),
    ]
    scores = mention_scores_for_catalog("muzeum w Płocku", places, [])
    assert len(strong_mention_keys(scores)) >= 3
    assert venue_focus_keys(scores, "muzeum w Płocku") == set()
