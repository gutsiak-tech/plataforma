import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import dashboard_router, health_router, map_router, meta_router
from app.config import settings
from app.db import get_conn, run_migrations

logger = logging.getLogger("uvicorn.error")


def _migrations_dir():
    if settings.migrations_dir:
        return Path(settings.migrations_dir)
    return Path(__file__).resolve().parent.parent.parent.parent / "database" / "migrations"


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "DB connection (password redacted): %s",
        settings.database_url_safe_log,
    )
    run_migrations(_migrations_dir())
    try:
        with get_conn() as conn:
            cur = conn.execute("SELECT 1")
            cur.fetchone()
        logger.info("Database connection OK")
    except Exception as e:
        logger.exception("Database connection failed: %s", e)
        raise
    yield


app = FastAPI(title="Plataforma Geospatial API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(meta_router)
app.include_router(dashboard_router)
app.include_router(map_router)
