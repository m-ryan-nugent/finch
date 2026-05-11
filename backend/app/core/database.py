"""Async SQLAlchemy engine, session factory, and base model class."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# echo=True logs every SQL statement — useful during development, noisy in production
engine = create_async_engine(
    settings.database_url,
    echo=(settings.app_env == "development"),
)

# expire_on_commit=False prevents SQLAlchemy from expiring attributes after commit.
# Without this, accessing any attribute on a committed object triggers a lazy load,
# which raises an error in async mode (lazy loads require a sync session).
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all ORM models.

    Every model that inherits from Base registers its table definition in
    Base.metadata — Alembic uses this to autogenerate migrations.
    """

    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides a database session per request.

    Commits on success, rolls back on exception, and always closes the session.
    Usage in routes: db: AsyncSession = Depends(get_db)
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
