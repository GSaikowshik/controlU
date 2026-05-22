import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator

class Settings(BaseSettings):
    # App Config
    APP_NAME: str = "controlU API"
    DEBUG: bool = True
    
    # CORS Config
    CORS_ORIGINS: str = ""
    
    # Database Config
    # Default to sqlite locally if no DATABASE_URL is provided, or a generic local postgres
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./controlu.db",
        validation_alias="DATABASE_URL"
    )
    
    # JWT Config
    # Generate a default secret key for development convenience
    JWT_SECRET_KEY: str = Field(
        default="SUPER_SECRET_AURA_KEY_DO_NOT_USE_IN_PRODUCTION_1234567890",
        validation_alias="JWT_SECRET_KEY"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 1 day

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @model_validator(mode="after")
    def validate_production_keys(self) -> 'Settings':
        if not self.DEBUG:
            if self.JWT_SECRET_KEY == "SUPER_SECRET_AURA_KEY_DO_NOT_USE_IN_PRODUCTION_1234567890":
                raise RuntimeError(
                    "Security Enforcement: JWT_SECRET_KEY cannot use the default fallback value in production mode (DEBUG=False)."
                )
            if self.DATABASE_URL == "sqlite+aiosqlite:///./controlu.db":
                raise RuntimeError(
                    "Security Enforcement: DATABASE_URL cannot use the default fallback value in production mode (DEBUG=False)."
                )
        return self

    @property
    def async_database_url(self) -> str:
        """
        Converts a standard PostgreSQL connection URL (e.g. from Supabase) 
        to an asyncpg compatible URL. If SQLite, returns as is.
        """
        url = self.DATABASE_URL
        
        # If it is SQLite, check if it's already using aiosqlite
        if url.startswith("sqlite://"):
            return url.replace("sqlite://", "sqlite+aiosqlite://")
            
        # Convert postgres:// or postgresql:// to postgresql+asyncpg://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            
        return url

settings = Settings()

