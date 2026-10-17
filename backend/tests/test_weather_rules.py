from __future__ import annotations

from backend.api.schemas.weather import WeatherCondition
from backend.weather.rules import compute_is_outdoor_friendly


def test_outdoor_friendly_clear_dry() -> None:
    assert compute_is_outdoor_friendly(
        condition=WeatherCondition.CLEAR,
        precipitation_mm_h=0.0,
    )


def test_outdoor_unfriendly_rain() -> None:
    assert not compute_is_outdoor_friendly(
        condition=WeatherCondition.RAIN,
        precipitation_mm_h=1.0,
    )


def test_outdoor_unfriendly_pm25() -> None:
    assert not compute_is_outdoor_friendly(
        condition=WeatherCondition.CLEAR,
        precipitation_mm_h=0.0,
        pm25_ug_m3=80.0,
    )


def test_outdoor_unfriendly_meteo_warning() -> None:
    assert not compute_is_outdoor_friendly(
        condition=WeatherCondition.CLOUDY,
        precipitation_mm_h=0.0,
        meteo_warning_active=True,
    )
