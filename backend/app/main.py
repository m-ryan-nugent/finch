"""FastAPI application entry point.

Assembles the app: CORS, router registration, and startup/shutdown lifecycle.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_v1_router
from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine
from app.services.category_service import seed_default_categories
from app.services.recurring_service import generate_all_due


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle.

    Replaces the deprecated @app.on_event("startup"/"shutdown") pattern.
    Code before `yield` runs on startup; code after runs on shutdown.
    """
    # Startup: seed categories and generate any due recurring transactions
    async with AsyncSessionLocal() as db:
        await seed_default_categories(db)
        await generate_all_due(db)
        await db.commit()
    yield
    # Shutdown: clean up the database engine's connection pool
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

# Allow all origins — the frontend is served separately and may come from
# a different port or hostname (both in local dev and in K3s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router, prefix=settings.api_v1_prefix)
