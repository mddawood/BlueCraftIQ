from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

engine = create_async_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    pool_pre_ping=True,
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db():
    """Dependency to get a standard DB session."""
    async with AsyncSessionLocal() as session:
        yield session

async def get_tenant_db(schema_name: str):
    """Dependency to get a tenant-specific DB session by switching the search_path."""
    async with AsyncSessionLocal() as session:
        # Switch search path to the tenant's schema
        await session.execute(f'SET search_path TO "{schema_name}"')
        yield session
