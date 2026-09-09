import socket
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import event, text
from app.core.config import settings
from app.core.context import tenant_id_var, bypass_rls_var

def is_postgres_running(host: str, port: int) -> bool:
    try:
        with socket.create_connection((host, port), timeout=1.0):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False

# Use Postgres if running, otherwise fallback to local SQLite for development
postgres_available = is_postgres_running(settings.POSTGRES_SERVER, int(settings.POSTGRES_PORT))

if postgres_available:
    db_url = settings.SQLALCHEMY_DATABASE_URI
    engine = create_async_engine(
        db_url,
        pool_pre_ping=True,
        echo=False,
    )
else:
    db_url = "sqlite+aiosqlite:///dev.db"
    engine = create_async_engine(
        db_url,
        echo=False,
        execution_options={"schema_translate_map": {"public": None}}
    )

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

from sqlalchemy.orm import Session

# Register event listener to run SET LOCAL on every transaction begin
@event.listens_for(Session, "after_begin")
def set_rls_variables(session, transaction, connection):
    if not engine.url.drivername.startswith("sqlite"):
        # Set statement timeout to 5000ms (5 seconds) to prevent runaway queries
        connection.execute(text("SELECT set_config('statement_timeout', '5000', true)"))
        
        tenant_id = tenant_id_var.get()
        bypass_rls = bypass_rls_var.get()
        
        if bypass_rls:
            connection.execute(text("SELECT set_config('app.bypass_rls', 'true', true)"))
        elif tenant_id:
            connection.execute(text("SELECT set_config('app.bypass_rls', 'false', true)"))
            connection.execute(
                text("SELECT set_config('app.current_tenant_id', :tenant_id, true)"),
                {"tenant_id": str(tenant_id)}
            )
        else:
            connection.execute(text("SELECT set_config('app.bypass_rls', 'false', true)"))
            connection.execute(text("SELECT set_config('app.current_tenant_id', '', true)"))

async def get_db():
    """Dependency to get a standard DB session."""
    async with AsyncSessionLocal() as session:
        yield session

