from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    mobile: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

class UserCreate(UserBase):
    password: str
    first_name: str
    last_name: str
    mobile: str
    street_address: str
    city: str
    state: str

class UserResponse(UserBase):
    id: UUID
    is_active: bool
    is_superuser: bool
    is_super_admin: bool = False
    created_at: datetime
    salesforce_id: Optional[str] = None

    class Config:
        from_attributes = True

class TenantSignup(BaseModel):
    company_name: str
    subdomain: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    mobile: str
    street_address: str
    city: str
    state: str

