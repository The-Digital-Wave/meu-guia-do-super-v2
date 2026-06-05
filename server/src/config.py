from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DATABASE_URL: str = "postgresql+asyncpg://meuguia:meuguia@localhost:5432/meuguia"
    JWT_SECRET: str = "change-me-in-production"
    JWT_REFRESH_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    REDIS_URL: str = "redis://localhost:6379"

    @field_validator("REDIS_URL", mode="before")
    @classmethod
    def require_valid_redis_scheme(cls, v: str) -> str:
        if not v or not v.startswith(("redis://", "rediss://", "unix://")):
            return "redis://localhost:6379"
        return v
    REDIS_TOKEN: str = ""
    ALLOWED_ORIGINS: str = "http://localhost:8081"
    ENVIRONMENT: str = "development"
    RESEND_API_KEY: str = ""
    CONTACT_EMAIL: str = "fabio9162@gmail.com"


settings = Settings()
