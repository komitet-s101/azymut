from __future__ import annotations

from backend.api.schemas.weather import WeatherCondition

PM25_OUTDOOR_THRESHOLD_UG_M3 = 55.0


def compute_is_outdoor_friendly(
    *,
    condition: WeatherCondition,
    precipitation_mm_h: float,
    pm25_ug_m3: float | None = None,
    meteo_warning_active: bool = False,
) -> bool:
    if meteo_warning_active:
        return False
    if condition in (
        WeatherCondition.RAIN,
        WeatherCondition.SNOW,
        WeatherCondition.STORM,
    ):
        return False
    if precipitation_mm_h > 0.5:
        return False
    if pm25_ug_m3 is not None and pm25_ug_m3 > PM25_OUTDOOR_THRESHOLD_UG_M3:
        return False
    return True


def wmo_code_to_condition(code: int) -> WeatherCondition:
    if code == 0:
        return WeatherCondition.CLEAR
    if code in (1, 2, 3):
        return WeatherCondition.CLOUDY
    if code in (45, 48):
        return WeatherCondition.CLOUDY
    if code in (51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82):
        return WeatherCondition.RAIN
    if code in (71, 73, 75, 77, 85, 86):
        return WeatherCondition.SNOW
    if code in (95, 96, 99):
        return WeatherCondition.STORM
    return WeatherCondition.UNKNOWN


def imgw_precip_to_condition(suma_opadu: str | None) -> WeatherCondition:
    if suma_opadu is None or suma_opadu == "":
        return WeatherCondition.UNKNOWN
    try:
        mm = float(suma_opadu)
    except ValueError:
        return WeatherCondition.UNKNOWN
    if mm >= 5:
        return WeatherCondition.RAIN
    if mm > 0:
        return WeatherCondition.CLOUDY
    return WeatherCondition.CLEAR
