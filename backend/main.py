from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.logging import configure_logging
from core.middleware import operation_log_middleware
from core.scheduler import start_scheduler, shutdown_scheduler
from db.init_db import init_db
from modules.router import api_router


def create_app() -> FastAPI:
    @asynccontextmanager
    async def lifespan(_: FastAPI):
        configure_logging()
        if os.getenv("SKIP_DB_INIT") != "1":
            init_db()
        start_scheduler()
        yield
        shutdown_scheduler()

    application = FastAPI(
        title=settings.project_name,
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router, prefix=settings.api_v1_prefix)
    application.middleware("http")(operation_log_middleware)
    return application


app = create_app()
