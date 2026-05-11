"""Application settings loaded from environment variables."""

from typing import Self
from urllib.parse import quote_plus

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for the Finch backend.

    pydantic-settings reads environment variables matching each field name
    (case-insensitive), falling back to values in a .env file.

    DATABASE_URL takes precedence if set. Otherwise, the async connection URL
    is assembled from the individual POSTGRES_* variables.
    """

    database_url: str | None = None

    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "finch"
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"

    app_env: str = "development"
    app_name: str = "Finch"
    api_v1_prefix: str = "/api/v1"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @model_validator(mode="after")
    def _assemble_database_url(self) -> Self:
        if self.database_url is None:
            self.database_url = (
                f"postgresql+asyncpg://"
                f"{quote_plus(self.postgres_user)}:{quote_plus(self.postgres_password)}"
                f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
            )
        return self


settings = Settings()
