import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from sqlalchemy.future import select

from app.core.config import settings
from app.api.routes import router as api_router
from app.db.session import engine, AsyncSessionLocal
from app.models.shared import Tenant
from app.core.context import tenant_id_var, bypass_rls_var

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
origins = [str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS if "*" not in str(origin)] if settings.BACKEND_CORS_ORIGINS else []
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://([^/]+\.)?localhost(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Multi-tenancy RLS context resolver middleware
@app.middleware("http")
async def tenant_context_middleware(request: Request, call_next):
    tenant_id = None
    rate_limit = 100 # Default limit
    is_super_admin = False
    jwt_tenant_id = None
    
    # 1. Check if request has authorization header (JWT)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            if payload.get("is_super_admin") is True:
                is_super_admin = True
            elif "tenant_id" in payload:
                jwt_tenant_id = uuid.UUID(payload["tenant_id"])
        except (JWTError, ValueError, TypeError):
            pass
            
    # 2. Resolve tenant subdomain or load JWT's tenant details
    if not is_super_admin:
        if jwt_tenant_id:
            # Query tenant by JWT tenant_id to get limit
            async with AsyncSessionLocal() as session:
                result = await session.execute(select(Tenant.id, Tenant.rate_limit_per_minute).where(Tenant.id == jwt_tenant_id))
                row = result.first()
                if row:
                    tenant_id, rate_limit = row
        else:
            # Resolve from subdomain
            subdomain = request.headers.get("X-Tenant-Subdomain")
            if not subdomain:
                host = request.headers.get("host", "").split(":")[0]
                parts = host.split(".")
                if len(parts) >= 2 and parts[-1] == "localhost" and parts[0] != "localhost":
                    subdomain = parts[0]
                elif len(parts) >= 3:
                    subdomain = parts[0]
                else:
                    subdomain = "msmc"
            async with AsyncSessionLocal() as session:
                result = await session.execute(select(Tenant.id, Tenant.rate_limit_per_minute).where(Tenant.subdomain == subdomain))
                row = result.first()
                if row:
                    tenant_id, rate_limit = row
                    
    # Set context variables
    tenant_id_token = tenant_id_var.set(tenant_id)
    bypass_rls_token = bypass_rls_var.set(is_super_admin)
    
    # 3. Check rate limiting if a tenant context exists
    if tenant_id and not is_super_admin and not request.url.path.endswith("/health"):
        from app.services.rate_limiter import limiter
        if limiter.is_rate_limited(str(tenant_id), rate_limit):
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=429,
                content={"detail": "Too Many Requests. Rate limit exceeded for your plan."}
            )
            
    try:
        response = await call_next(request)
        
        # Log per-tenant API usage (exempt health checks)
        resolved_tenant_id = tenant_id_var.get()
        if resolved_tenant_id and not request.url.path.endswith("/health"):
            from app.models.usage_events import UsageEvent
            async with AsyncSessionLocal() as session:
                event = UsageEvent(
                    tenant_id=resolved_tenant_id,
                    path=request.url.path,
                    method=request.method,
                    status_code=response.status_code
                )
                session.add(event)
                await session.commit()
                
        return response
    finally:
        # Reset ContextVars to avoid pollution
        tenant_id_var.reset(tenant_id_token)
        bypass_rls_var.reset(bypass_rls_token)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def on_startup():
    # If using SQLite fallback, auto-create tables and seed default tenant
    if engine.url.drivername.startswith("sqlite"):
        from app.db.base_class import Base
        from app.db.session import AsyncSessionLocal
        from app.models.shared import Tenant
        from app.models.tenant import User, MembershipTier, Subscription
        from sqlalchemy.future import select

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Tenant).where(Tenant.subdomain == "msmc"))
            tenant = result.scalar_one_or_none()
            if not tenant:
                tenant = Tenant(
                    name="Mount Sinai Muslim Center",
                    subdomain="msmc",
                    schema_name="msmc",
                    plan="free",
                    status="active",
                    is_active=True
                )
                session.add(tenant)
                await session.flush() # Get tenant ID
                
                # Seed default member user
                from app.core import security
                member = User(
                    tenant_id=tenant.id,
                    email="member@msmc.com",
                    hashed_password=security.get_password_hash("Password123"),
                    first_name="John",
                    last_name="Member",
                    is_active=True,
                    is_superuser=False,
                    is_super_admin=False
                )
                
                # Seed default super admin user
                admin = User(
                    tenant_id=tenant.id,
                    email="admin@saas.com",
                    hashed_password=security.get_password_hash("Password123"),
                    first_name="Global",
                    last_name="Admin",
                    is_active=True,
                    is_superuser=True,
                    is_super_admin=True
                )
                
                session.add(member)
                session.add(admin)
                await session.commit()

@app.get("/health")
def health_check():
    return {"status": "ok"}
