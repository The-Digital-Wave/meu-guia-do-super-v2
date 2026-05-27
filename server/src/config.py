from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://meuguia:meuguia@localhost:5432/meuguia"
    JWT_SECRET: str = "change-me-in-production"
    JWT_REFRESH_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    REDIS_URL: str = "redis://localhost:6379"
    ENVIRONMENT: str = "development"
    RESEND_API_KEY: str = ""
    CONTACT_EMAIL: str = "fabio9162@gmail.com"

    class Config:
        env_file = ".env"


settings = Settings()
