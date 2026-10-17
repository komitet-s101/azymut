from __future__ import annotations

import json

import pytest

from backend.llm.client import LLMClient
from backend.settings import Settings, get_settings


class _Response:
    def __init__(self, status_code: int, payload: dict | None = None, text: str = "") -> None:
        self.status_code = status_code
        self._payload = payload or {}
        self.text = text or json.dumps(self._payload)

    def json(self) -> dict:
        return self._payload


class _FakeHttp:
    posts: list[dict] = []

    def __init__(self, *args: object, **kwargs: object) -> None:
        self.posts: list[dict] = []

    async def __aenter__(self) -> _FakeHttp:
        return self

    async def __aexit__(self, *args: object) -> None:
        return None

    async def post(self, url: str, headers: dict, json: dict) -> _Response:
        self.posts.append({"url": url, "headers": headers, "json": json})
        _FakeHttp.posts.append(self.posts[-1])
        schema = json["response_format"]["type"]
        if schema == "json_schema":
            return _Response(400, text="response_format unsupported")
        return _Response(
            200,
            {"choices": [{"message": {"role": "assistant", "content": "{\"ok\": true}"}}]},
        )


@pytest.fixture(autouse=True)
def _clear_posts() -> None:
    _FakeHttp.posts = []


def _settings() -> Settings:
    return Settings(
        groq_api_key="gsk_test",
        llm_api_key="",
        llm_base_url="https://api.groq.com/openai/v1",
        llm_model="openai/gpt-oss-120b",
        llm_reasoning_effort="low",
        _env_file=None,
    )


@pytest.mark.anyio
async def test_client_sends_groq_model_and_falls_back_from_schema(monkeypatch) -> None:
    monkeypatch.setattr("backend.llm.client.httpx.AsyncClient", _FakeHttp)
    client = LLMClient(_settings())
    raw = await client.chat_completion(
        [{"role": "user", "content": "cześć"}],
        json_schema={"type": "object", "additionalProperties": False, "properties": {}, "required": []},
        schema_name="search_filter",
    )
    assert raw == '{"ok": true}'
    assert len(_FakeHttp.posts) == 2
    first, second = _FakeHttp.posts
    assert first["url"] == "https://api.groq.com/openai/v1/chat/completions"
    assert first["headers"]["Authorization"] == "Bearer gsk_test"
    assert first["json"]["model"] == "openai/gpt-oss-120b"
    assert first["json"]["reasoning_effort"] == "low"
    assert first["json"]["include_reasoning"] is False
    assert "temperature" not in first["json"]
    assert first["json"]["response_format"]["type"] == "json_schema"
    assert first["json"]["response_format"]["json_schema"]["strict"] is True
    assert second["json"]["response_format"] == {"type": "json_object"}


def test_default_model_is_groq_gpt_oss_120b(monkeypatch) -> None:
    for name in ("LLM_MODEL", "LLM_BASE_URL", "LLM_REASONING_EFFORT", "GROQ_API_KEY"):
        monkeypatch.delenv(name, raising=False)
    get_settings.cache_clear()
    settings = Settings(_env_file=None)
    assert settings.llm_model == "openai/gpt-oss-120b"
    assert settings.llm_base_url == "https://api.groq.com/openai/v1"
    assert settings.llm_reasoning_effort == "low"
    get_settings.cache_clear()
