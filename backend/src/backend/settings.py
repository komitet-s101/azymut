from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    admin_enabled: bool = False

    llm_base_url: str = "http://localhost:11434/v1"
    llm_model: str = "speakleash/bielik-11b-v2.3-instruct:Q4_K_M"
    llm_api_key: str = ""
    llm_timeout_seconds: float = 120.0
    llm_max_tokens: int = 2048
    llm_temperature: float = 0.2
    llm_retry_temperature: float = 0.1
    planner_stub: bool = True

    weather_provider: str = "stub"
    weather_api_key: str = ""
    weather_api_base_url: str = ""
    weather_cache_ttl_seconds: int = 300

    inpost_locker_code: str = ""
    inpost_locker_id: str = ""
    inpost_enabled: bool = True

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
