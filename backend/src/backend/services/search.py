from __future__ import annotations

import json
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import httpx
from tortoise.expressions import Q

from backend.api.schemas.search import (
    SEARCH_REASONS_JSON_SCHEMA,
    SearchFilter,
    SearchRequest,
    SearchResponse,
    SearchResult,
    SearchResultFlag,
    SettingPreference,
)
from backend.api.schemas.weather import (
    WeatherCondition,
    WeatherForecast,
    WeatherProviderError,
)
from backend.db.models import Event, OpeningHours, Place, PriceLevel
from backend.llm.client import LLMClient, LLMUnavailableError
from backend.llm.parser import extract_json_object
from backend.llm.query_parser import ParsedQuery, parse_search_query
from backend.services.search_rank import ScoreInput, WeatherBias, rank_matches
from backend.services.weather import get_weather_service
from backend.settings import Settings, get_settings

_WARSAW = ZoneInfo("Europe/Warsaw")
_PLOCK_LAT = 52.5468
_PLOCK_LON = 19.7064
_WEEKDAYS_PL = (
    "poniedziałek",
    "wtorek",
    "środa",
    "czwartek",
    "piątek",
    "sobota",
    "niedziela",
)
_BAD_WEATHER = {WeatherCondition.RAIN, WeatherCondition.SNOW, WeatherCondition.STORM}
_REASONS_PROMPT = (
    Path(__file__).resolve().parents[1] / "llm" / "prompts" / "search_reasons.pl.md"
)


def warsaw_today() -> date:
    return datetime.now(_WARSAW).date()


def summarize_filter(filt: SearchFilter) -> str:
    parts: list[str] = []
    if filt.time_budget_minutes:
        minutes = filt.time_budget_minutes
        if minutes % 60 == 0:
            hours = minutes // 60
            if hours == 1:
                parts.append("1 godzina")
            elif hours < 5:
                parts.append(f"{hours} godziny")
            else:
                parts.append(f"{hours} godzin")
        else:
            parts.append(f"{minutes} min")
    if filt.day_of_week is not None:
        parts.append(_WEEKDAYS_PL[filt.day_of_week])
    if filt.group.children:
        noun = "dziecko" if filt.group.children == 1 else "dzieci"
        parts.append(f"{filt.group.children} {noun}")
    if filt.max_price_level == 0 and filt.price_strict:
        parts.append("bezpłatne")
    elif filt.max_price_level == 0:
        parts.append("najlepiej bezpłatne")
    elif filt.max_price_level == 1 and not filt.price_strict:
        parts.append("tanio")
    if filt.setting is SettingPreference.OUTDOOR:
        parts.append(
            "tylko na zewnątrz" if filt.setting_strict else "na świeżym powietrzu"
        )
    elif filt.setting is SettingPreference.INDOOR:
        parts.append("tylko pod dachem" if filt.setting_strict else "pod dachem")
    if filt.city:
        parts.append(filt.city)
    return " · ".join(parts) if parts else "Propozycje na Twój czas"


def _weather_note(bias: WeatherBias, setting: SettingPreference) -> str | None:
    if not bias.used:
        return None
    if bias.raining:
        return (
            "Prognoza zapowiada deszcz — wyżej są miejsca pod dachem "
            "i te, które dobrze znoszą deszcz."
        )
    if setting is SettingPreference.OUTDOOR:
        return "Pogoda sprzyja wyjściu na świeże powietrze."
    return "Pogoda nie powinna przeszkadzać w planie."


def _split_secondary(value: str | None) -> tuple[str, ...]:
    if not value:
        return ()
    return tuple(part.strip() for part in value.split(";") if part.strip())


def _price_int(value: PriceLevel | int | None) -> int | None:
    if value is None:
        return None
    return int(value)


def _minutes_between(start: str | None, end: str | None) -> int | None:
    if not start or not end or ":" not in start or ":" not in end:
        return None
    try:
        start_h, start_m = (int(part) for part in start.split(":", 1))
        end_h, end_m = (int(part) for part in end.split(":", 1))
    except ValueError:
        return None
    delta = (end_h * 60 + end_m) - (start_h * 60 + start_m)
    if delta <= 0:
        return None
    return delta


def _kids(filt: SearchFilter) -> bool:
    return filt.group.children > 0 or bool(filt.group.child_ages)


async def _candidate_places(filt: SearchFilter) -> list[Place]:
    qs = Place.all()
    if filt.city:
        qs = qs.filter(city__iexact=filt.city)
    if filt.time_budget_minutes is not None:
        qs = qs.filter(typical_visit_minutes__lte=filt.time_budget_minutes)
    if _kids(filt):
        qs = qs.filter(adult_only=False)
    if filt.setting_strict and filt.setting is SettingPreference.OUTDOOR:
        qs = qs.filter(is_outdoor=True)
    elif filt.setting_strict and filt.setting is SettingPreference.INDOOR:
        qs = qs.filter(is_indoor=True)
    if filt.price_strict and filt.max_price_level is not None:
        qs = qs.filter(
            Q(price_level__isnull=True) | Q(price_level__lte=filt.max_price_level)
        )
    return await qs


async def _open_place_ids(day_of_week: int) -> tuple[set[int], set[int]]:
    rows = await OpeningHours.all().values_list("place_id", "day_of_week")
    any_hours: set[int] = set()
    open_today: set[int] = set()
    for place_id, weekday in rows:
        any_hours.add(place_id)
        if weekday == day_of_week:
            open_today.add(place_id)
    return any_hours, open_today


def _event_blocked(event: Event, filt: SearchFilter) -> bool:
    if filt.time_budget_minutes is not None:
        duration = _minutes_between(event.start_time, event.end_time)
        if duration is not None and duration > filt.time_budget_minutes:
            return True
    if filt.price_strict and filt.max_price_level is not None and not event.is_free:
        price = _price_int(event.price_level)
        if price is not None and price > filt.max_price_level:
            return True
    if _kids(filt) and event.age_group:
        age_group = event.age_group.lower()
        if any(token in age_group for token in ("18", "senior", "doros")):
            return True
    return False


async def _candidate_events(filt: SearchFilter) -> list[Event]:
    if filt.date is None:
        return []
    qs = Event.filter(start_date=filt.date)
    if filt.city:
        qs = qs.filter(Q(city__iexact=filt.city) | Q(city__isnull=True))
    events = await qs
    return [event for event in events if not _event_blocked(event, filt)]


def _event_category(event: Event) -> str | None:
    if event.category:
        return event.category
    if event.sport:
        return "kibicowanie_wydarzenia_sportowe"
    return None


def _event_price(event: Event) -> int | None:
    if event.is_free:
        return 0
    return _price_int(event.price_level)


def _place_flags(
    place: Place,
    *,
    any_hours: set[int],
    check_day: bool,
) -> list[SearchResultFlag]:
    flags: list[SearchResultFlag] = []
    if place.price_level is None:
        flags.append(SearchResultFlag.PRICE_UNCONFIRMED)
    if check_day and place.id not in any_hours:
        flags.append(SearchResultFlag.CHECK_HOURS)
    return flags


def _event_flags(event: Event) -> list[SearchResultFlag]:
    if event.is_free or event.price_level is not None:
        return []
    return [SearchResultFlag.PRICE_UNCONFIRMED]


async def _weather_bias(target: date | None, lat: float, lon: float) -> WeatherBias:
    service = get_weather_service()
    forecast: WeatherForecast | None = None
    try:
        forecast = await service.get_forecast(lat, lon, hours=72)
    except (WeatherProviderError, httpx.HTTPError, OSError):
        forecast = None
    if forecast is not None and target is not None:
        daytime = [
            hour
            for hour in forecast.hours
            if hour.start.astimezone(_WARSAW).date() == target
            and 8 <= hour.start.astimezone(_WARSAW).hour <= 19
        ]
        if daytime:
            bad = sum(
                1
                for hour in daytime
                if hour.condition in _BAD_WEATHER or not hour.is_outdoor_friendly
            )
            return WeatherBias(
                raining=bad * 2 >= len(daytime),
                condition=daytime[0].condition.value,
                used=True,
            )
    try:
        snapshot = await service.get_current(lat, lon)
    except (WeatherProviderError, httpx.HTTPError, OSError):
        return WeatherBias(raining=False, used=False)
    raining = (not snapshot.is_outdoor_friendly) or snapshot.condition in _BAD_WEATHER
    return WeatherBias(raining=raining, condition=snapshot.condition.value, used=True)


def _reasons_prompt() -> str:
    return _REASONS_PROMPT.read_text(encoding="utf-8").strip()


async def explain_results(
    results: list[SearchResult],
    *,
    query: str,
    filt: SearchFilter,
    client: LLMClient,
) -> None:
    if not results:
        return
    payload = [
        {
            "kind": item.kind,
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "city": item.city,
            "flags": [flag.value for flag in item.flags],
        }
        for item in results[:15]
    ]
    user = json.dumps(
        {"query": query, "filter": filt.model_dump(mode="json"), "results": payload},
        ensure_ascii=False,
    )
    raw = await client.chat_completion(
        [
            {"role": "system", "content": _reasons_prompt()},
            {"role": "user", "content": user},
        ],
        json_schema=SEARCH_REASONS_JSON_SCHEMA,
        schema_name="search_reasons",
    )
    data = extract_json_object(raw)
    rows = data.get("items")
    if not isinstance(rows, list):
        raise ValueError("missing items")
    by_key = {(item.kind, item.id): item for item in results}
    for row in rows:
        if not isinstance(row, dict):
            continue
        target = by_key.get((row.get("kind"), row.get("id")))
        reason = row.get("reason")
        if target is None or not isinstance(reason, str):
            continue
        text = " ".join(reason.split())
        if text:
            target.reason = text[:160]


async def _maybe_explain(
    results: list[SearchResult],
    *,
    query: str,
    filt: SearchFilter,
    settings: Settings,
) -> None:
    if not settings.search_llm_reasons or not settings.resolved_llm_api_key:
        return
    try:
        await explain_results(
            results,
            query=query,
            filt=filt,
            client=LLMClient(settings),
        )
    except (LLMUnavailableError, ValueError, json.JSONDecodeError, OSError):
        return


async def search_catalog(
    request: SearchRequest,
    *,
    today: date | None = None,
    settings: Settings | None = None,
) -> SearchResponse:
    resolved_settings = settings or get_settings()
    parsed: ParsedQuery = await parse_search_query(
        request.query,
        today=today or warsaw_today(),
        settings=resolved_settings,
    )
    filt = parsed.filter
    places = await _candidate_places(filt)
    any_hours: set[int] = set()
    open_today: set[int] = set()
    if filt.day_of_week is not None:
        any_hours, open_today = await _open_place_ids(filt.day_of_week)
        places = [
            place
            for place in places
            if place.id not in any_hours or place.id in open_today
        ]
    events = await _candidate_events(filt)

    scored_inputs: list[ScoreInput] = []
    place_by_key: dict[str, Place] = {}
    event_by_key: dict[str, Event] = {}
    for place in places:
        key = f"place:{place.id}"
        place_by_key[key] = place
        scored_inputs.append(
            ScoreInput(
                key=key,
                category=place.category,
                secondary_categories=_split_secondary(place.secondary_categories),
                family_friendly=place.family_friendly or 0,
                rain_suitable=place.rain_suitable or 0,
                physical_activity_level=place.physical_activity_level or 0,
                is_indoor=bool(place.is_indoor),
                is_outdoor=bool(place.is_outdoor),
                min_age_recommended=place.min_age_recommended,
                price_level=_price_int(place.price_level),
                kind="place",
            )
        )
    for event in events:
        key = f"event:{event.id}"
        event_by_key[key] = event
        category = _event_category(event)
        activity = 4 if category == "sport_aktywny_wypoczynek" else 1 if event.sport else 0
        scored_inputs.append(
            ScoreInput(
                key=key,
                category=category,
                family_friendly=2,
                rain_suitable=2,
                physical_activity_level=activity,
                price_level=_event_price(event),
                kind="event",
            )
        )

    lat = request.lat if request.lat is not None else _PLOCK_LAT
    lon = request.lon if request.lon is not None else _PLOCK_LON
    bias = await _weather_bias(filt.date, lat, lon)
    ranked = rank_matches(scored_inputs, filt, bias)[: request.limit]

    results: list[SearchResult] = []
    for item, score in ranked:
        if item.kind == "place":
            place = place_by_key[item.key]
            results.append(
                SearchResult(
                    kind="place",
                    id=place.id,
                    name=place.name,
                    category=place.category,
                    city=place.city,
                    score=round(score, 2),
                    flags=_place_flags(
                        place,
                        any_hours=any_hours,
                        check_day=filt.day_of_week is not None,
                    ),
                    price_level=_price_int(place.price_level),
                    is_indoor=bool(place.is_indoor),
                    is_outdoor=bool(place.is_outdoor),
                    typical_visit_minutes=place.typical_visit_minutes,
                    address_line=place.address_line,
                    latitude=place.latitude,
                    longitude=place.longitude,
                )
            )
            continue
        event = event_by_key[item.key]
        results.append(
            SearchResult(
                kind="event",
                id=event.id,
                name=event.name,
                category=_event_category(event),
                city=event.city,
                score=round(score, 2),
                flags=_event_flags(event),
                price_level=_event_price(event),
                typical_visit_minutes=_minutes_between(event.start_time, event.end_time),
                address_line=event.address_line,
                latitude=event.latitude,
                longitude=event.longitude,
                start_date=event.start_date,
                start_time=event.start_time,
            )
        )

    await _maybe_explain(
        results,
        query=request.query,
        filt=filt,
        settings=resolved_settings,
    )
    return SearchResponse(
        query=request.query,
        summary=summarize_filter(filt),
        filter=filt,
        parser=parsed.source,
        weather_used=bias.used,
        weather_raining=bias.raining,
        weather_note=_weather_note(bias, filt.setting),
        results=results,
    )
