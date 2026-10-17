from __future__ import annotations

from typing import Any

import httpx

from backend.settings import Settings, get_settings


class LLMUnavailableError(Exception):
    """Home Bielik unreachable or returned an error."""


class LLMClient:
    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()

    async def chat_completion(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float | None = None,
        json_object: bool = True,
    ) -> str:
        url = f"{self._settings.llm_base_url.rstrip('/')}/chat/completions"
        headers: dict[str, str] = {"Content-Type": "application/json"}
        if self._settings.llm_api_key:
            headers["Authorization"] = f"Bearer {self._settings.llm_api_key}"

        body: dict[str, Any] = {
            "model": self._settings.llm_model,
            "messages": messages,
            "temperature": temperature
            if temperature is not None
            else self._settings.llm_temperature,
            "max_tokens": self._settings.llm_max_tokens,
        }
        if json_object:
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

        data = response.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise LLMUnavailableError("Unexpected LLM response shape") from exc
