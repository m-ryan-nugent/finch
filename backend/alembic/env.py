"""Alembic environment configured for async SQLAlchemy.

The key trick: Alembic's migration context is synchronous, but our app uses
an async engine. We bridge this with connection.run_sync(), which runs a
synchronous callable inside the async connection's transaction.
"""

import asyncio
from logging.config import fileConfig

from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

# Import all models so their tables register with Base.metadata
from app.models import *  # noqa: F401, F403
from app.core.config import settings
from app.core.database import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# This is what Alembic compares against the database to generate migrations
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Generate SQL scripts without a live database connection."""
    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    """Run migrations using a synchronous connection (called via run_sync)."""
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations with an async engine, bridging to sync for Alembic."""
    connectable = create_async_engine(settings.database_url)

    async with connectable.connect() as connection:
        # run_sync runs a sync function inside the async connection's context
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
