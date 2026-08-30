from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.dependencies import get_current_tenant_db, get_current_user, get_db
from app.core import security
from app.core.config import settings
from app.models.tenant import User
from app.models.shared import Tenant
from app.schemas.user import Token, UserResponse, UserCreate, TenantSignup
from app.db.session import engine
from sqlalchemy import text

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_access_token(
    db: AsyncSession = Depends(get_current_tenant_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests.
    This routes against the specific tenant's database schema.
    """
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            user.id,
            tenant_id=user.tenant_id,
            is_super_admin=user.is_super_admin,
            expires_delta=access_token_expires
        ),
        token_type="bearer",
    )

@router.post("/register", response_model=UserResponse)
async def register_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_current_tenant_db)
):
    """
    Register a new user for the current tenant.
    """
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        first_name=user_in.first_name,
        middle_name=user_in.middle_name,
        last_name=user_in.last_name,
        mobile=user_in.mobile,
        street_address=user_in.street_address,
        city=user_in.city,
        state=user_in.state,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: User = Depends(get_current_user),
):
    """
    Get current user.
    """
    return current_user

@router.post("/register-tenant", response_model=UserResponse)
async def register_tenant(
    tenant_in: TenantSignup,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new tenant organization and its first admin user in a single transaction.
    """
    # 1. Check if subdomain is already taken
    result = await db.execute(select(Tenant).where(Tenant.subdomain == tenant_in.subdomain))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This subdomain is already registered.",
        )
        
    # 2. Check if email is already taken globally by bypassing RLS
    if not engine.url.drivername.startswith("sqlite"):
        await db.execute(text("SET LOCAL app.bypass_rls = 'true'"))
        
    email_result = await db.execute(select(User).where(User.email == tenant_in.email))
    if email_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
        
    # 3. Create Tenant
    tenant = Tenant(
        name=tenant_in.company_name,
        subdomain=tenant_in.subdomain,
        schema_name=tenant_in.subdomain,
        plan="free",
        status="active",
        is_active=True
    )
    db.add(tenant)
    await db.flush() # Get tenant.id (UUID)
    
    # 4. Set current_tenant_id so user creation doesn't fail RLS check
    if not engine.url.drivername.startswith("sqlite"):
        await db.execute(text("SET LOCAL app.bypass_rls = 'false'"))
        await db.execute(
            text("SET LOCAL app.current_tenant_id = :tenant_id"),
            {"tenant_id": str(tenant.id)}
        )
        
    # 5. Create admin user
    user = User(
        tenant_id=tenant.id,
        email=tenant_in.email,
        hashed_password=security.get_password_hash(tenant_in.password),
        first_name=tenant_in.first_name,
        last_name=tenant_in.last_name,
        mobile=tenant_in.mobile,
        street_address=tenant_in.street_address,
        city=tenant_in.city,
        state=tenant_in.state,
        is_superuser=True, # Tenant admin
        is_super_admin=False
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return user
