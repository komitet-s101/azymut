from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tortoise import Tortoise

from backend.api.errors import http_exception_handler, validation_exception_handler
from backend.api.routers import (
    health,
    interest_packages,
    plan,
    places,
    routing,
    routes,
    search,
    weather,
)
from backend.db.config import DB_DIR, TORTOISE_ORM
from backend.settings import get_settings
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    await Tortoise.init(config=TORTOISE_ORM, _enable_global_fallback=True)
    yield
    await Tortoise.close_connections()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Leisure planner API",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(places.router, prefix="/api/v1")
    app.include_router(routes.router, prefix="/api/v1")
    app.include_router(interest_packages.router, prefix="/api/v1")
    app.include_router(plan.router, prefix="/api/v1")
    app.include_router(search.router, prefix="/api/v1")
    app.include_router(routing.router, prefix="/api/v1")
    app.include_router(weather.router, prefix="/api/v1")

    if settings.admin_enabled:
        from backend.api.routers import admin_places, admin_routes, admin_seed

        app.include_router(admin_places.router, prefix="/api/v1")
        app.include_router(admin_routes.router, prefix="/api/v1")
        app.include_router(admin_seed.router, prefix="/api/v1")

    return app


app = create_app()
