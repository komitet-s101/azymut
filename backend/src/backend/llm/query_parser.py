from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Literal

from pydantic import ValidationError

from backend.api.schemas.search import (
    PlaceCategory,
    SearchFilter,
    SearchGroup,
    SettingPreference,
    search_filter_json_schema,
)
from backend.llm.client import LLMClient, LLMUnavailableError
from backend.llm.parser import extract_json_object
from backend.settings import Settings, get_settings

_PROMPTS = Path(__file__).resolve().parent / "prompts"
_WEEKDAYS_PL = (
    "poniedziałek",
    "wtorek",
    "środa",
    "czwartek",
    "piątek",
    "sobota",
    "niedziela",
)
_FOLD = str.maketrans("ąćęłńóśźż", "acelnoszz")
_WEEKDAY_PATTERNS: tuple[tuple[int, str], ...] = (
    (5, r"sobot"),
    (6, r"niedziel"),
    (0, r"poniedzial"),
    (1, r"wtork"),
    (2, r"srod[ae]"),
    (3, r"czwart"),
    (4, r"piat"),
)
_CITY_STEMS: tuple[tuple[str, str], ...] = (
    ("Brudzeń Duży", "brudzen"),
    ("Nowy Duninów", "duninow"),
    ("Staroźreby", "starozreb"),
    ("Wyszogród", "wyszogrod"),
    ("Włocławek", "wloclawek"),
    ("Dobrzyków", "dobrzykow"),
    ("Cierszewo", "cierszew"),
    ("Bodzanów", "bodzanow"),
    ("Radzanowo", "radzanow"),
    ("Gostynin", "gostynin"),
    ("Cekanowo", "cekanow"),
    ("Sierpc", "sierpc"),
    ("Brwilno", "brwiln"),
    ("Drobin", "drobin"),
    ("Lucień", "lucien"),
    ("Sikórz", "sikorz"),
    ("Słupno", "slupn"),
    ("Płock", "plock"),
    ("Gąbin", "gabin"),
    ("Łąck", "lack"),
)
_INTEREST_PHRASES: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("zabawa_gry_adrenalina", ("park linow", "trampolin", "adrenalin", "plac zabaw", "escape")),
    ("sport_aktywny_wypoczynek", ("sport", "basen", "silown", "orlik", "boisko", "plywal", "fitness", "rower", "biegan", "tenis", "sciank", "aquapark")),
    ("kibicowanie_wydarzenia_sportowe", ("mecz", "kibic")),
    ("historia_zabytki", ("muzeum", "zabytek", "histori", "zamek")),
    ("sakralne_wielokulturowosc", ("kosciol", "katedr", "sakral", "cerkiew")),
    ("warsztaty_nauka_pasje", ("warsztat", "ceramik", "nauka")),
    ("przyroda_spacery_widoki", ("przyrod", "spacer", "zoo", "las", "widok", "natura", "ogrod", "park")),
    ("jedzenie_lokalne_smaki", ("restaurac", "jedzen", "kawiarn", "obiad", "smak")),
    ("kultura_sztuka_film", ("kino", "teatr", "sztuk", "film")),
    ("muzyka_widowiska", ("koncert", "muzyk")),
    ("relaks_wypoczynek", ("spa", "sauna", "relaks", "wellness")),
    ("rzemioslo_pamiatki_produkty", ("pamiatk", "rzemios")),
    ("festiwale_lokalne_swieta", ("festiwal", "jarmark", "swiet")),
)
_INTEREST_ALIASES = {
    "sport": PlaceCategory.SPORT_AKTYWNY_WYPOCZYNEK,
    "basen": PlaceCategory.SPORT_AKTYWNY_WYPOCZYNEK,
    "przyroda": PlaceCategory.PRZYRODA_SPACERY_WIDOKI,
    "spacer": PlaceCategory.PRZYRODA_SPACERY_WIDOKI,
    "park": PlaceCategory.PRZYRODA_SPACERY_WIDOKI,
    "zoo": PlaceCategory.PRZYRODA_SPACERY_WIDOKI,
    "historia": PlaceCategory.HISTORIA_ZABYTKI,
    "muzeum": PlaceCategory.HISTORIA_ZABYTKI,
    "zabytek": PlaceCategory.HISTORIA_ZABYTKI,
    "jedzenie": PlaceCategory.JEDZENIE_LOKALNE_SMAKI,
    "restauracja": PlaceCategory.JEDZENIE_LOKALNE_SMAKI,
    "kultura": PlaceCategory.KULTURA_SZTUKA_FILM,
    "kino": PlaceCategory.KULTURA_SZTUKA_FILM,
    "muzyka": PlaceCategory.MUZYKA_WIDOWISKA,
    "koncert": PlaceCategory.MUZYKA_WIDOWISKA,
    "relaks": PlaceCategory.RELAKS_WYPOCZYNEK,
    "sauna": PlaceCategory.RELAKS_WYPOCZYNEK,
    "spa": PlaceCategory.RELAKS_WYPOCZYNEK,
    "warsztaty": PlaceCategory.WARSZTATY_NAUKA_PASJE,
    "festiwal": PlaceCategory.FESTIWALE_LOKALNE_SWIETA,
    "kibic": PlaceCategory.KIBICOWANIE_WYDARZENIA_SPORTOWE,
    "mecz": PlaceCategory.KIBICOWANIE_WYDARZENIA_SPORTOWE,
    "zabawa": PlaceCategory.ZABAWA_GRY_ADRENALINA,
}
_SOFT_MARKERS = ("najlepiej", "najchetniej", "jesli sie da", "o ile")
_STRICT_MARKERS = ("tylko", "koniecznie", "musi", "wylacznie")
_OUTDOOR_RE = re.compile(r"swiezym powietrzu|na dworze|na zewnatrz|pod chmurka|w plenerze|\bplener\b|\bspacer")
_INDOOR_RE = re.compile(r"pod dachem|w srodku|w domu|w budynku")
_FREE_RE = re.compile(r"bezplatn\w*|darmow\w*|za darmo|wstep wolny|nie chce placic|bez oplat")
_EVENT_QUERY_RE = re.compile(
    r"\b(wydarzen\w*|koncert\w*|spektakl\w*|mecz\w*|festiwal\w*|jarmark\w*|"
    r"repertuar\w*|pokaz\w*|wystep\w*|bilet\w*|kino\w*|film\w*|teatr\w*|"
    r"kibic\w*|liga\b|derby|kalend\w* imprez)"
)
_EVENT_INTERESTS = frozenset(
    {
        PlaceCategory.KIBICOWANIE_WYDARZENIA_SPORTOWE,
        PlaceCategory.MUZYKA_WIDOWISKA,
        PlaceCategory.FESTIWALE_LOKALNE_SWIETA,
    }
)
_CULTURE_EVENT_HINTS = ("kino", "film", "spektakl", "teatr", "pokaz", "wystep", "bilet")
_HOUR_WORDS = {
    "jedna": 60,
    "dwie": 120,
    "trzy": 180,
    "cztery": 240,
    "piec": 300,
    "szesc": 360,
}
_STOP_COUNT_WORDS = {
    "jedno": 1,
    "jedna": 1,
    "jeden": 1,
    "dwa": 2,
    "dwie": 2,
    "trzy": 3,
    "cztery": 4,
    "piec": 5,
    "szesc": 6,
}
_STOP_COUNT_RE = re.compile(
    r"(\d+)\s*(miejsc\w*|atrakcj\w*|punkt\w*|propozycj\w*|stop\w*)\b"
)
_STOP_COUNT_WORD_RE = re.compile(
    r"\b(jedn\w+|dwa|dwie|trzy|czter\w*|piec|szesc)\s+"
    r"(miejsc\w*|atrakcj\w*|punkt\w*|propozycj\w*|stop\w*)\b"
)


@dataclass(frozen=True)
class ParsedQuery:
    filter: SearchFilter
    source: Literal["llm", "rules"]


def fold(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower().translate(_FOLD)).strip()


def canonical_city(value: str | None) -> str | None:
    if value is None:
        return None
    text = fold(value)
    if not text:
        return None
    best: tuple[int, str] | None = None
    for name, stem in _CITY_STEMS:
        if re.search(rf"(?<![a-z]){re.escape(stem)}\w*", text):
            if best is None or len(stem) > best[0]:
                best = (len(stem), name)
    if best is not None:
        return best[1]
    cleaned = value.strip()
    return cleaned or None


def _next_date(today: date, weekday: int) -> date:
    delta = (weekday - today.weekday()) % 7
    return today + timedelta(days=delta)


def _with_resolved_date(filt: SearchFilter, today: date) -> SearchFilter:
    updates: dict[str, Any] = {}
    if filt.day_of_week is not None and filt.date is None:
        updates["date"] = _next_date(today, filt.day_of_week)
    elif filt.date is not None and filt.day_of_week is None:
        updates["day_of_week"] = filt.date.weekday()
    if not updates:
        return filt
    return filt.model_copy(update=updates)


def _marker_before(text: str, start: int, markers: tuple[str, ...]) -> bool:
    window = text[max(0, start - 24) : start]
    return any(marker in window for marker in markers)


def _as_int(value: Any) -> int | None:
    if isinstance(value, bool) or value is None or value == "":
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    text = str(value).strip()
    if re.fullmatch(r"-?\d+", text):
        return int(text)
    return None


def _as_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return default
    text = fold(str(value))
    if text in {"true", "1", "tak", "yes"}:
        return True
    if text in {"false", "0", "nie", "no"}:
        return False
    return default


def _day_of_week_value(value: Any) -> int | None:
    if value is None or value == "":
        return None
    number = _as_int(value)
    if number is not None and 0 <= number <= 6:
        return number
    text = fold(str(value))
    for weekday, pattern in _WEEKDAY_PATTERNS:
        if re.search(pattern, text):
            return weekday
    return None


def _price_level_value(value: Any) -> int | None:
    if value is None or value == "":
        return None
    number = _as_int(value)
    if number is not None and 0 <= number <= 3:
        return number
    text = fold(str(value))
    if any(token in text for token in ("bezplat", "darmo", "free", "wolny")):
        return 0
    if "tani" in text:
        return 1
    return None


def _setting_value(value: Any) -> SettingPreference:
    text = fold(str(value or ""))
    if not text or text in {"either", "obojetnie", "dowolnie"}:
        return SettingPreference.EITHER
    if text in {"indoor", "in"} or any(token in text for token in ("pod dachem", "w domu", "w srodku", "indoor")):
        return SettingPreference.INDOOR
    if text in {"outdoor", "out"} or any(token in text for token in ("outdoor", "zewnatrz", "powietrz", "plener", "dwor")):
        return SettingPreference.OUTDOOR
    return SettingPreference.EITHER


def _interest_value(value: Any) -> PlaceCategory | None:
    text = fold(str(value)).replace("-", "_").replace(" ", "_")
    if text in PlaceCategory._value2member_map_:
        return PlaceCategory(text)
    alias = _INTEREST_ALIASES.get(text)
    if alias is not None:
        return alias
    for category in PlaceCategory:
        if category.value in text or text in category.value:
            return category
    return None


def _interests_value(value: Any) -> list[PlaceCategory]:
    if value is None or value == "":
        return []
    raw_items: list[Any]
    if isinstance(value, str):
        raw_items = [part for part in re.split(r"[,;]", value) if part.strip()]
    elif isinstance(value, list):
        raw_items = value
    else:
        raw_items = [value]
    found: list[PlaceCategory] = []
    for item in raw_items:
        category = _interest_value(item)
        if category is not None and category not in found:
            found.append(category)
    return found


def _ages_value(value: Any) -> list[int]:
    if value is None or value == "":
        return []
    if isinstance(value, list):
        ages = [_as_int(item) for item in value]
        return [age for age in ages if age is not None and 0 <= age <= 17]
    text = fold(str(value))
    return [int(part) for part in re.findall(r"\d+", text) if 0 <= int(part) <= 17]


def _date_value(value: Any) -> date | None:
    if value is None or value == "":
        return None
    if isinstance(value, date):
        return value
    text = str(value).strip()
    try:
        return date.fromisoformat(text[:10])
    except ValueError:
        return None


def coerce_search_filter(payload: dict[str, Any], *, today: date) -> SearchFilter:
    group_raw = payload.get("group") if isinstance(payload.get("group"), dict) else {}
    adults = _as_int(payload.get("adults", group_raw.get("adults")))
    children = _as_int(payload.get("children", group_raw.get("children")))
    ages = _ages_value(payload.get("child_ages", group_raw.get("child_ages")))
    minutes = _as_int(payload.get("time_budget_minutes"))
    filt = SearchFilter.model_validate(
        {
            "date": _date_value(payload.get("date")),
            "day_of_week": _day_of_week_value(payload.get("day_of_week")),
            "time_budget_minutes": minutes if minutes and minutes > 0 else None,
            "group": {
                "adults": 1 if adults is None else adults,
                "children": 0 if children is None else children,
                "child_ages": ages,
            },
            "max_price_level": _price_level_value(payload.get("max_price_level")),
            "price_strict": _as_bool(payload.get("price_strict")),
            "setting": _setting_value(payload.get("setting")),
            "setting_strict": _as_bool(payload.get("setting_strict")),
            "interests": _interests_value(payload.get("interests")),
            "city": canonical_city(payload.get("city") if isinstance(payload.get("city"), str) else None),
            "stop_count": _stop_count_value(payload.get("stop_count")),
        }
    )
    return _with_resolved_date(filt, today)


def _pln_to_level(amount: int) -> int:
    if amount <= 0:
        return 0
    if amount <= 30:
        return 1
    if amount <= 80:
        return 2
    return 3


def _party(text: str) -> SearchGroup:
    adults = 1
    if re.search(r"z\s+(zona|mezem|partner|dziewczyn|chlopak)", text):
        adults = 2
    numbered = re.search(r"(\d+)\s*osob", text)
    if numbered:
        adults = max(adults, int(numbered.group(1)))
    elif re.search(r"\b(dwie|dwoch|dwoje)\s+osob", text):
        adults = max(adults, 2)

    ages: list[int] = []
    joined = re.search(r"((?:\d+\s*(?:,|i)\s*)+\d+)\s+lat\b", text)
    if joined:
        ages.extend(int(part) for part in re.findall(r"\d+", joined.group(1)))
    else:
        single = re.search(r"(\d+)\s+lat\b", text)
        if single:
            ages.append(int(single.group(1)))
    for match in re.finditer(r"(\d+)\s*-\s*lat", text):
        age = int(match.group(1))
        if age not in ages:
            ages.append(age)
    ages = [age for age in ages if 0 <= age <= 17]

    children: int | None = None
    if re.search(r"bez dzieci|bez dziecka|dla doros|sami doros|tylko doros|\bdorosl", text):
        children = 0
        ages = []
    else:
        numbered_kids = re.search(r"(\d+)\s+dziec", text)
        word_kids = re.search(
            r"(dwojk\w*|dwoje|dwoch|trojk\w*|troje|czwork\w*)\s+dziec",
            text,
        )
        if numbered_kids:
            children = int(numbered_kids.group(1))
        elif word_kids:
            word = word_kids.group(1)
            if word.startswith("tro"):
                children = 3
            elif word.startswith("czw"):
                children = 4
            else:
                children = 2
        elif ages:
            children = max(len(ages), 1)
        elif re.search(r"dzieci\b|dziecmi\b", text):
            children = 2
        elif re.search(r"dzieck", text) or re.search(r"wozk|niemowl|rodzin", text):
            children = 1
        if re.search(r"wozk|niemowl", text) and not ages:
            ages = [1]
            children = max(children or 0, 1)
        if ages and (children or 0) < len(ages):
            children = len(ages)
    if children is None:
        children = 0
    return SearchGroup(adults=adults, children=children, child_ages=ages)


def _stop_count_value(value: Any) -> int | None:
    number = _as_int(value)
    if number is not None and 1 <= number <= 10:
        return number
    return None


def _stop_count(text: str) -> int | None:
    digits = _STOP_COUNT_RE.search(text)
    if digits:
        count = int(digits.group(1))
        if 1 <= count <= 10:
            return count
    words = _STOP_COUNT_WORD_RE.search(text)
    if words:
        stem = words.group(1)
        for key, count in _STOP_COUNT_WORDS.items():
            if stem == key or stem.startswith(key):
                return count
    return None


def _minutes(text: str) -> int | None:
    if re.search(r"poltorej godz|poltora godz", text):
        return 90
    if re.search(r"pol godz", text):
        return 30
    digits = re.search(r"(\d+)\s*(?:godzin\w*|h)\b", text)
    if digits:
        return int(digits.group(1)) * 60
    minutes = re.search(r"(\d+)\s*minut", text)
    if minutes:
        return int(minutes.group(1))
    words = re.search(r"\b(jedna|dwie|trzy|cztery|piec|szesc)\s+godzin", text)
    if words:
        return _HOUR_WORDS[words.group(1)]
    return None


def _when(text: str, today: date) -> tuple[date | None, int | None]:
    for weekday, pattern in _WEEKDAY_PATTERNS:
        if re.search(pattern, text):
            return _next_date(today, weekday), weekday
    if re.search(r"\bpojutrze\b", text):
        target = today + timedelta(days=2)
        return target, target.weekday()
    if re.search(r"\bjutro\b", text):
        target = today + timedelta(days=1)
        return target, target.weekday()
    if re.search(r"\bdzis\b|\bdzisiaj\b", text):
        return today, today.weekday()
    if re.search(r"weekend", text):
        if today.weekday() >= 5:
            return today, today.weekday()
        target = _next_date(today, 5)
        return target, 5
    return None, None


def _price(text: str) -> tuple[int | None, bool]:
    match = _FREE_RE.search(text)
    if match:
        strict = not _marker_before(text, match.start(), _SOFT_MARKERS)
        return 0, strict
    budget = re.search(r"(?:budzet\s+do|do)\s+(\d+)\s*zl", text)
    if budget:
        strict = not _marker_before(text, budget.start(), _SOFT_MARKERS)
        return _pln_to_level(int(budget.group(1))), strict
    cheap = re.search(r"\btani\w*|\btanio\b", text)
    if cheap:
        return 1, False
    return None, False


def _setting(text: str) -> tuple[SettingPreference, bool]:
    outdoor = _OUTDOOR_RE.search(text)
    indoor = _INDOOR_RE.search(text)
    if outdoor is None and indoor is None:
        return SettingPreference.EITHER, False
    chosen = outdoor
    preference = SettingPreference.OUTDOOR
    if indoor and (outdoor is None or indoor.start() > outdoor.start()):
        chosen = indoor
        preference = SettingPreference.INDOOR
    if outdoor and indoor:
        outdoor_strict = _marker_before(text, outdoor.start(), _STRICT_MARKERS)
        indoor_strict = _marker_before(text, indoor.start(), _STRICT_MARKERS)
        if indoor_strict and not outdoor_strict:
            chosen = indoor
            preference = SettingPreference.INDOOR
        elif outdoor_strict and not indoor_strict:
            chosen = outdoor
            preference = SettingPreference.OUTDOOR
    assert chosen is not None
    if _marker_before(text, chosen.start(), _STRICT_MARKERS):
        return preference, True
    return preference, False


def _stem_match(stem: str, word: str) -> bool:
    if not word.startswith(stem):
        return False
    if stem == "spa" and word.startswith("spacer"):
        return False
    return True


def _has_phrase(words: list[str], phrase: str) -> bool:
    parts = phrase.split()
    width = len(parts)
    for index in range(len(words) - width + 1):
        if not all(_stem_match(parts[offset], words[index + offset]) for offset in range(width)):
            continue
        if parts == ["park"] and index + 1 < len(words) and words[index + 1].startswith("linow"):
            continue
        return True
    return False


def _interests(text: str) -> list[PlaceCategory]:
    words = re.findall(r"[a-z0-9]+", text)
    found: list[PlaceCategory] = []
    for category, phrases in _INTEREST_PHRASES:
        if any(_has_phrase(words, phrase) for phrase in phrases):
            value = PlaceCategory(category)
            if value not in found:
                found.append(value)
    return found


def _city(text: str) -> str | None:
    found: tuple[int, int, str] | None = None
    for name, stem in _CITY_STEMS:
        match = re.search(rf"(?<![a-z]){re.escape(stem)}\w*", text)
        if match is None:
            continue
        candidate = (match.start(), -len(stem), name)
        if found is None or candidate < found:
            found = candidate
    if found is None:
        return None
    return found[2]


def query_event_intent(query: str, filt: SearchFilter) -> bool:
    text = fold(query)
    if _EVENT_QUERY_RE.search(text):
        return True
    interests = set(filt.interests)
    if interests & _EVENT_INTERESTS:
        return True
    if PlaceCategory.KULTURA_SZTUKA_FILM in interests and any(
        hint in text for hint in _CULTURE_EVENT_HINTS
    ):
        return True
    return False


def apply_search_defaults(
    filt: SearchFilter,
    query: str,
    today: date,
) -> SearchFilter:
    updated = filt
    if updated.date is None and query_event_intent(query, updated):
        updated = updated.model_copy(
            update={"date": today, "day_of_week": today.weekday()},
        )
    return _with_resolved_date(updated, today)


def parse_search_query_rules(query: str, *, today: date) -> SearchFilter:
    text = fold(query)
    target_date, weekday = _when(text, today)
    max_price, price_strict = _price(text)
    setting, setting_strict = _setting(text)
    minutes = _minutes(text)
    filt = SearchFilter(
        date=target_date,
        day_of_week=weekday,
        time_budget_minutes=minutes,
        group=_party(text),
        max_price_level=max_price,
        price_strict=price_strict,
        setting=setting,
        setting_strict=setting_strict,
        interests=_interests(text),
        city=_city(text),
        stop_count=_stop_count(text),
    )
    return apply_search_defaults(filt, query, today)


def _system_prompt(today: date) -> str:
    template = (_PROMPTS / "search_filter.pl.md").read_text(encoding="utf-8")
    categories = "\n".join(f"- {item.value}" for item in PlaceCategory)
    return (
        template.replace("{{TODAY}}", today.isoformat())
        .replace("{{WEEKDAY}}", _WEEKDAYS_PL[today.weekday()])
        .replace("{{DOW}}", str(today.weekday()))
        .replace("{{CATEGORIES}}", categories)
    )


def _retry_message(error: str) -> str:
    return (
        "Poprzedni JSON nie przeszedł walidacji. Popraw tylko filtr, bez nazw miejsc.\n"
        f"Błędy: {error}"
    )


async def _from_llm(
    client: LLMClient,
    query: str,
    *,
    today: date,
) -> SearchFilter:
    messages: list[dict[str, str]] = [
        {"role": "system", "content": _system_prompt(today)},
        {"role": "user", "content": query.strip()},
    ]
    last_error = "invalid"
    for attempt in range(2):
        raw = await client.chat_completion(
            messages,
            json_object=True,
            json_schema=search_filter_json_schema() if attempt == 0 else None,
            schema_name="search_filter",
        )
        try:
            return coerce_search_filter(extract_json_object(raw), today=today)
        except (json.JSONDecodeError, ValidationError, ValueError) as exc:
            last_error = str(exc)
            if attempt == 1:
                raise ValueError(last_error) from exc
            messages.append({"role": "assistant", "content": raw})
            messages.append({"role": "user", "content": _retry_message(last_error)})
    raise ValueError(last_error)


async def parse_search_query(
    query: str,
    *,
    today: date | None = None,
    client: LLMClient | None = None,
    settings: Settings | None = None,
) -> ParsedQuery:
    resolved_today = today or date.today()
    rules = parse_search_query_rules(query, today=resolved_today)
    resolved_settings = settings or get_settings()
    llm = client
    if llm is None:
        if not resolved_settings.resolved_llm_api_key:
            return ParsedQuery(filter=rules, source="rules")
        llm = LLMClient(resolved_settings)
    try:
        parsed = apply_search_defaults(
            await _from_llm(llm, query, today=resolved_today),
            query,
            resolved_today,
        )
    except (LLMUnavailableError, ValidationError, ValueError, json.JSONDecodeError):
        return ParsedQuery(filter=rules, source="rules")
    return ParsedQuery(filter=parsed, source="llm")
