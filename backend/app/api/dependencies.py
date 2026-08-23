from fastapi import Header, HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import jwt, JWTError
from app.db.session import get_db, get_tenant_db
from app.models.shared import Tenant
from app.models.tenant import User
from app.core.config import settings
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_tenant_from_request(request: Request, db: AsyncSession = Depends(get_db)) -> Tenant:
    """
    Extracts the tenant from the subdomain or custom header.
    Example: org1.domain.com -> subdomain='org1'
    """
    # For local dev without subdomains, we can use a custom header 'X-Tenant-Subdomain'
    subdomain = request.headers.get("X-Tenant-Subdomain")
    
    if not subdomain:
        host = request.headers.get("host", "")
        if "localhost" in host or "127.0.0.1" in host:
            # Fallback for dev if header missing
            subdomain = "tenant1"
        else:
            # Extract subdomain: org1.example.com -> org1
            parts = host.split(".")
            if len(parts) >= 3:
                subdomain = parts[0]
            else:
                raise HTTPException(status_code=400, detail="Tenant subdomain missing")

    result = await db.execute(select(Tenant).where(Tenant.subdomain == subdomain))
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    return tenant

async def get_current_tenant_db(tenant: Tenant = Depends(get_tenant_from_request)):
    """Yields a database session scoped to the current tenant's schema."""
    async for session in get_tenant_db(tenant.schema_name):
        yield session

async def get_current_user(
    db: AsyncSession = Depends(get_current_tenant_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
