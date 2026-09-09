import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, text

from app.api.dependencies import get_db, get_current_super_admin
from app.models.shared import Tenant
from app.models.tenant import User
from app.models.usage_events import UsageEvent
from app.core import security
from app.core.config import settings

router = APIRouter()

# Schema definitions
class TenantStatusUpdate(BaseModel):
    status: str # active, suspended

class TenantPlanUpdate(BaseModel):
    plan: str # free, pro, enterprise

class UsageEventResponse(BaseModel):
    id: uuid.UUID
    path: str
    method: str
    status_code: int
    timestamp: datetime

    class Config:
        from_attributes = True

class TenantAdminResponse(BaseModel):
    id: uuid.UUID
    name: str
    subdomain: str
    plan: str
    status: str
    rate_limit_per_minute: int
    is_active: bool
    created_at: datetime
    usage_count: int

    class Config:
        from_attributes = True

class TenantDetailResponse(BaseModel):
    id: uuid.UUID
    name: str
    subdomain: str
    plan: str
    status: str
    rate_limit_per_minute: int
    is_active: bool
    created_at: datetime
    usage_events: List[UsageEventResponse]

    class Config:
        from_attributes = True

class ImpersonateResponse(BaseModel):
    access_token: str
    token_type: str


@router.get("/tenants", response_model=List[TenantAdminResponse])
async def list_tenants(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_super_admin)
):
    """
    Get all tenants with their plans, status, and usage count.
    """
    # 1. Fetch tenants
    tenants_result = await db.execute(select(Tenant))
    tenants = tenants_result.scalars().all()
    
    # 2. Fetch usage event count per tenant
    # Since usage_events is in the public schema, we can query it globally
    usage_result = await db.execute(
        select(UsageEvent.tenant_id, func.count(UsageEvent.id))
        .group_by(UsageEvent.tenant_id)
    )
    usage_map = {row[0]: row[1] for row in usage_result.all()}
    
    response = []
    for t in tenants:
        response.append(
            TenantAdminResponse(
                id=t.id,
                name=t.name,
                subdomain=t.subdomain,
                plan=t.plan,
                status=t.status,
                rate_limit_per_minute=t.rate_limit_per_minute,
                is_active=t.is_active,
                created_at=t.created_at,
                usage_count=usage_map.get(t.id, 0)
            )
        )
    return response


@router.get("/tenants/{tenant_id}", response_model=TenantDetailResponse)
async def get_tenant_details(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_super_admin)
):
    """
    Get detailed information about a single tenant, including recent usage events.
    """
    tenant_result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    events_result = await db.execute(
        select(UsageEvent)
        .where(UsageEvent.tenant_id == tenant_id)
        .order_by(UsageEvent.timestamp.desc())
        .limit(100)
    )
    events = events_result.scalars().all()
    
    return TenantDetailResponse(
        id=tenant.id,
        name=tenant.name,
        subdomain=tenant.subdomain,
        plan=tenant.plan,
        status=tenant.status,
        rate_limit_per_minute=tenant.rate_limit_per_minute,
        is_active=tenant.is_active,
        created_at=tenant.created_at,
        usage_events=[UsageEventResponse.from_orm(e) for e in events]
    )


@router.post("/tenants/{tenant_id}/status", response_model=TenantAdminResponse)
async def update_tenant_status(
    tenant_id: uuid.UUID,
    status_in: TenantStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_super_admin)
):
    """
    Suspend or reactivate a tenant.
    """
    tenant_result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    tenant.status = status_in.status
    tenant.is_active = (status_in.status == "active")
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    
    # Return count mapping
    usage_result = await db.execute(
        select(func.count(UsageEvent.id)).where(UsageEvent.tenant_id == tenant_id)
    )
    usage_count = usage_result.scalar() or 0
    
    return TenantAdminResponse(
        id=tenant.id,
        name=tenant.name,
        subdomain=tenant.subdomain,
        plan=tenant.plan,
        status=tenant.status,
        rate_limit_per_minute=tenant.rate_limit_per_minute,
        is_active=tenant.is_active,
        created_at=tenant.created_at,
        usage_count=usage_count
    )


@router.post("/tenants/{tenant_id}/plan", response_model=TenantAdminResponse)
async def update_tenant_plan(
    tenant_id: uuid.UUID,
    plan_in: TenantPlanUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_super_admin)
):
    """
    Change a tenant's plan and update their rate limits.
    """
    tenant_result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    plan = plan_in.plan.lower()
    if plan not in ["free", "pro", "enterprise"]:
        raise HTTPException(status_code=400, detail="Invalid plan name")
        
    # Map plans to limits
    rate_limits = {
        "free": 100,
        "pro": 1000,
        "enterprise": 1000000
    }
    
    tenant.plan = plan
    tenant.rate_limit_per_minute = rate_limits[plan]
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    
    usage_result = await db.execute(
        select(func.count(UsageEvent.id)).where(UsageEvent.tenant_id == tenant_id)
    )
    usage_count = usage_result.scalar() or 0
    
    return TenantAdminResponse(
        id=tenant.id,
        name=tenant.name,
        subdomain=tenant.subdomain,
        plan=tenant.plan,
        status=tenant.status,
        rate_limit_per_minute=tenant.rate_limit_per_minute,
        is_active=tenant.is_active,
        created_at=tenant.created_at,
        usage_count=usage_count
    )


@router.post("/tenants/{tenant_id}/impersonate", response_model=ImpersonateResponse)
async def impersonate_tenant(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_super_admin)
):
    """
    Generates a support/impersonation JWT token for debugging a tenant.
    """
    # 1. Fetch any active user belonging to the tenant.
    # Since we are checking users table and we want to query globally, we bypass RLS.
    from app.db.session import engine
    if not engine.url.drivername.startswith("sqlite"):
        await db.execute(text("SET LOCAL app.bypass_rls = 'true'"))
        
    result = await db.execute(
        select(User)
        .where(User.tenant_id == tenant_id)
        .where(User.is_active == True)
        .limit(1)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=400, 
            detail="Cannot impersonate: No active users exist for this tenant."
        )
        
    # Log/Audit: Support impersonation event
    # In a real app, you would save this to an audit log table.
    print(f"AUDIT LOG: Admin {current_admin.email} impersonated Tenant {tenant_id} as User {user.email}")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(
        user.id,
        tenant_id=user.tenant_id,
        is_super_admin=False, # Impersonated context runs with user's access, not super admin
        expires_delta=access_token_expires
    )
    
    return ImpersonateResponse(access_token=token, token_type="bearer")
