from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator
from app.config import settings

# Create async engine
engine = create_async_engine(
    settings.async_database_url, 
    echo=settings.DEBUG,
    # Silence pool warnings for SQLite, adjust pool settings for Production Postgres
    **({"connect_args": {"check_same_thread": False}} if settings.async_database_url.startswith("sqlite") else {})
)

# Async session factory
SessionLocal = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

# Declarative base class for SQLAlchemy models
class Base(DeclarativeBase):
    pass

# Dependency to get db session in endpoints
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
