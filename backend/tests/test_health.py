from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_health(api_client: AsyncClient) -> None:
    response = await api_client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] in ("ok", "degraded")
    assert "db" in body
