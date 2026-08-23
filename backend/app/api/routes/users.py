from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.dependencies import get_current_tenant_db, get_current_active_user
from app.models.tenant import User
from app.schemas.user import UserResponse

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_current_tenant_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve users. For the tenant admin.
    """
    if not current_user.is_superuser:
        # If not admin, maybe return only themselves or an error.
        # For simplicity, returning just the current user if not admin.
        return [current_user]

    result = await db.execute(select(User).offset(skip).limit(limit))
    users = result.scalars().all()
    return users
