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

    # Groq OpenAI-compatible API. Swap models with LLM_MODEL
    # (for example openai/gpt-oss-20b) without code changes.
    groq_api_key: str = ""
    llm_base_url: str = "https://api.groq.com/openai/v1"
    llm_model: str = "openai/gpt-oss-120b"
    llm_api_key: str = ""
    llm_reasoning_effort: str = "low"
    llm_timeout_seconds: float = 45.0
    llm_max_tokens: int = 2048
    llm_temperature: float = 0.2
    llm_retry_temperature: float = 0.1
    planner_stub: bool = True
    # When true, a second Groq call writes a short Polish reason per top hit.
    search_llm_reasons: bool = False

    weather_provider: str = "stub"
    weather_api_key: str = ""
    weather_api_base_url: str = ""
    weather_cache_ttl_seconds: int = 300

    inpost_locker_code: str = ""
    inpost_locker_id: str = ""
    inpost_enabled: bool = True

    osrm_base_url: str = "https://router.project-osrm.org"
    osrm_timeout_seconds: float = 20.0

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def resolved_llm_api_key(self) -> str:
        return self.groq_api_key.strip() or self.llm_api_key.strip()


@lru_cache
def get_settings() -> Settings:
    return Settings()
