from __future__ import annotations

import logging as lg

import uvicorn

from backend.settings import get_settings


def main() -> None:
    lg.basicConfig(level=lg.INFO)
    lg.getLogger("tortoise").setLevel(lg.WARNING)
    lg.getLogger("aiosqlite").setLevel(lg.WARNING)

    settings = get_settings()
    _ = settings  # eager load for log visibility in future

    uvicorn.run(
        "backend.api.app:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )


if __name__ == "__main__":
    main()
