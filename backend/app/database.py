import logging
import traceback
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator
from app.config import settings

# Initialize database logger
logger = logging.getLogger("controlu.database")
logger.setLevel(logging.INFO)

logger.info(f"[DB] Initializing async database engine with URL target: {settings.async_database_url}")

# Create async engine
try:
    engine = create_async_engine(
        settings.async_database_url, 
        echo=settings.DEBUG,
        # Silence pool warnings for SQLite, adjust pool settings for Production Postgres
        **({"connect_args": {"check_same_thread": False}} if settings.async_database_url.startswith("sqlite") else {})
    )
    logger.info("[DB] Async database engine created successfully.")
except Exception as e:
    print(f"=== [RAW DB ERROR] FATAL ENGINE INIT FAILURE: {e} ===")
    logger.critical(f"[DB] FATAL: Failed to initialize SQLite or Postgres engine: {e}")
    logger.critical(traceback.format_exc())
    raise

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
    logger.info("[DB] Request received to open a new database session.")
    try:
        async with SessionLocal() as session:
            logger.info("[DB] Session established successfully. Yielding database handle.")
            try:
                yield session
            except Exception as e:
                print(f"=== [RAW DB ERROR] DB QUERY EXECUTION FAILED IN TX CONTEXT: {e} ===")
                logger.error(f"[DB] Database query execution failed within transaction context: {e}")
                logger.error(f"[DB] Traceback details:\n{traceback.format_exc()}")
                await session.rollback()
                raise
            finally:
                logger.info("[DB] Transaction block finalized. Closing database session.")
                await session.close()
    except Exception as e:
        print(f"=== [RAW DB ERROR] FAILED TO RETRIEVE/ESTABLISH CONNECTION: {e} ===")
        logger.critical(f"[DB] FATAL: Failed to retrieve or establish connection pool session: {e}")
        logger.critical(f"[DB] Connection Traceback:\n{traceback.format_exc()}")
        raise
