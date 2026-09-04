import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

logger = logging.getLogger(__name__)

# Engine configuration supporting both PostgreSQL (asyncpg) and SQLite (aiosqlite)
is_postgres = "postgresql" in settings.DATABASE_URL.lower()

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True if is_postgres else False
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    """
    Initializes database tables. If running on PostgreSQL, enables the pgvector extension.
    """
    async with engine.begin() as conn:
        if is_postgres:
            try:
                # Enable pgvector extension in PostgreSQL
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                logger.info("Successfully initialized PostgreSQL pgvector extension.")
            except Exception as e:
                logger.warning(f"Notice during pgvector extension initialization: {e}")

        await conn.run_sync(Base.metadata.create_all)
