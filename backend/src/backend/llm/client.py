from __future__ import annotations

from typing import Any

import httpx

from backend.settings import Settings, get_settings


class LLMUnavailableError(Exception):
    """Groq (or another OpenAI-compatible endpoint) was unreachable or failed."""


def _message_text(message: dict[str, Any]) -> str:
    content = message.get("content")
    if isinstance(content, str) and content.strip():
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and isinstance(item.get("text"), str):
                parts.append(item["text"])
        text = "\n".join(part for part in parts if part.strip())
        if text.strip():
            return text
    raise LLMUnavailableError("Empty LLM content")


class LLMClient:
    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()

    async def chat_completion(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float | None = None,
        json_object: bool = True,
        json_schema: dict[str, Any] | None = None,
        schema_name: str = "response",
        reasoning_effort: str | None = None,
    ) -> str:
        effort = reasoning_effort
        if effort is None:
            effort = self._settings.llm_reasoning_effort.strip() or None
        try:
            return await self._post(
                messages,
                temperature=temperature,
                json_object=json_object,
                json_schema=json_schema,
                schema_name=schema_name,
                reasoning_effort=effort,
            )
        except LLMUnavailableError as exc:
            if json_schema is None or "HTTP 400" not in str(exc):
                raise
            return await self._post(
                messages,
                temperature=temperature,
                json_object=True,
                json_schema=None,
                schema_name=schema_name,
                reasoning_effort=effort,
            )

    async def _post(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float | None,
        json_object: bool,
        json_schema: dict[str, Any] | None,
        schema_name: str,
        reasoning_effort: str | None,
    ) -> str:
        url = f"{self._settings.llm_base_url.rstrip('/')}/chat/completions"
        headers: dict[str, str] = {"Content-Type": "application/json"}
        api_key = self._settings.resolved_llm_api_key
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        body: dict[str, Any] = {
            "model": self._settings.llm_model,
            "messages": messages,
            "max_tokens": self._settings.llm_max_tokens,
        }
        if reasoning_effort:
            body["reasoning_effort"] = reasoning_effort
            body["include_reasoning"] = False
        else:
            body["temperature"] = (
                temperature
                if temperature is not None
                else self._settings.llm_temperature
            )
        if json_schema is not None:
            body["response_format"] = {
                "type": "json_schema",
                "json_schema": {
                    "name": schema_name,
                    "strict": True,
                    "schema": json_schema,
                },
            }
        elif json_object:
            body["response_format"] = {"type": "json_object"}

        try:
            async with httpx.AsyncClient(
                timeout=self._settings.llm_timeout_seconds
            ) as client:
                response = await client.post(url, headers=headers, json=body)
        except (httpx.TimeoutException, httpx.RequestError) as exc:
            raise LLMUnavailableError(str(exc)) from exc

        if response.status_code >= 400:
            raise LLMUnavailableError(
                f"LLM HTTP {response.status_code}: {response.text[:500]}"
            )

        try:
            data = response.json()
            return _message_text(data["choices"][0]["message"])
        except (KeyError, IndexError, TypeError) as exc:
            raise LLMUnavailableError("Unexpected LLM response shape") from exc
