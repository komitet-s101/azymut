from __future__ import annotations

import asyncio
import logging as lg
import threading
from collections.abc import Coroutine
from typing import Any, TypeVar

from tortoise import Tortoise

from backend.db.config import DB_DIR, TORTOISE_ORM

T = TypeVar("T")


class Database:
    def __init__(self) -> None:
        self.logger: lg.Logger = lg.getLogger(
            f"{__name__}.{self.__class__.__name__}"
        )
        self._loop: asyncio.AbstractEventLoop | None = None
        self._thread: threading.Thread | None = None
        self._ready: threading.Event = threading.Event()

    def start(self) -> None:
        if self._thread is not None:
            return
        DB_DIR.mkdir(parents=True, exist_ok=True)
        self._thread = threading.Thread(
            target=self._run_loop,
            name="Database-Thread",
            daemon=True,
        )
        self._thread.start()
        _ = self._ready.wait()
        self.logger.info("Database started")

    def run(self, coro: Coroutine[Any, Any, T]) -> T:
        if self._loop is None:
            raise RuntimeError("Database not started")
        future = asyncio.run_coroutine_threadsafe(coro, self._loop)
        return future.result()

    def stop(self) -> None:
        if self._loop is None or self._thread is None:
            return

        async def _shutdown() -> None:
            await Tortoise.close_connections()

        _ = self.run(_shutdown())
        _ = self._loop.call_soon_threadsafe(self._loop.stop)
        self._thread.join()
        self._loop = None
        self._thread = None
        self.logger.info("Database stopped")

    def _run_loop(self) -> None:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        self._loop = loop

        async def _init() -> None:
            _ = await Tortoise.init(
                config=TORTOISE_ORM,
                _enable_global_fallback=True,
            )

        loop.run_until_complete(_init())
        self._ready.set()
        loop.run_forever()


database: Database = Database()
