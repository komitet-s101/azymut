from __future__ import annotations

import unicodedata

# Approximate WMO synoptic station coordinates (lat, lon) keyed by normalized name.
_STATION_COORDS: dict[str, tuple[float, float]] = {
    "bialystok": (53.11, 23.17),
    "bielsko biala": (49.80, 19.05),
    "chojnice": (53.70, 17.57),
    "czestochowa": (50.82, 19.12),
    "elblag": (54.16, 19.40),
    "gdansk": (54.38, 18.63),
    "gorzow": (52.74, 15.23),
    "hel": (54.61, 18.80),
    "jelenia gora": (50.90, 15.73),
    "kalisz": (51.76, 18.08),
    "kasprowy wierch": (49.23, 19.98),
    "katowice": (50.26, 19.02),
    "ketrzyn": (54.08, 21.38),
    "kielce": (50.87, 20.63),
    "klodzko": (50.44, 16.66),
    "kolo": (52.20, 18.64),
    "kolobrzeg": (54.18, 15.58),
    "koszalin": (54.19, 16.18),
    "kozienice": (51.58, 21.55),
    "krakow": (50.08, 19.79),
    "krosno": (49.69, 21.77),
    "legnica": (51.21, 16.16),
    "lesko": (49.47, 22.33),
    "leszno": (51.84, 16.57),
    "lebork": (54.54, 17.75),
    "lublin": (51.23, 22.57),
    "leba": (54.76, 17.55),
    "lodz": (51.73, 19.40),
    "mikolajki": (53.80, 21.57),
    "mlawa": (52.84, 20.39),
    "nowy sacz": (49.62, 20.70),
    "olsztyn": (53.78, 20.48),
    "opole": (50.67, 17.93),
    "ostroleka": (53.08, 21.57),
    "pila": (53.15, 16.74),
    "platforma": (54.80, 18.50),
    "plock": (52.55, 19.71),
    "poznan": (52.42, 16.83),
    "przemysl": (49.78, 22.77),
    "raciborz": (50.09, 18.22),
    "resko": (53.77, 15.41),
    "rzeszow": (50.10, 22.05),
    "sandomierz": (50.68, 21.75),
    "siedlce": (52.17, 22.28),
    "slubice": (52.35, 14.56),
    "sulejow": (51.35, 19.88),
    "suwalki": (54.10, 22.93),
    "szczecin": (53.40, 14.62),
    "szczecinek": (53.71, 16.69),
    "sniezka": (50.74, 15.74),
    "swinoujscie": (53.91, 14.25),
    "tarnow": (50.01, 20.99),
    "terespol": (52.08, 23.61),
    "torun": (53.03, 18.55),
    "ustka": (54.58, 16.86),
    "warszawa": (52.28, 21.00),
    "wielun": (51.22, 18.57),
    "wlodawa": (51.55, 23.55),
    "wroclaw": (51.13, 16.88),
    "zakopane": (49.30, 19.95),
    "zamosc": (50.72, 23.25),
    "zielona gora": (51.93, 15.50),
}


def _normalize_name(name: str) -> str:
    lowered = name.lower().strip()
    nfkd = unicodedata.normalize("NFKD", lowered)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def station_coords(station_name: str) -> tuple[float, float] | None:
    return _STATION_COORDS.get(_normalize_name(station_name))
