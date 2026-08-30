import uuid
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base

# Note: We do NOT set __table_args__ = {"schema": "..."} here. 
# These tables will be created in whichever schema is currently set in the search_path.

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id"), index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String)
    middle_name = Column(String, nullable=True)
    last_name = Column(String)
    mobile = Column(String, nullable=True)  # nullable in DB for safety/backwards compatibility, but validated in API
    street_address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    is_super_admin = Column(Boolean, default=False, nullable=False)
    
    salesforce_id = Column(String, nullable=True) # ID in Salesforce Org
    created_at = Column(DateTime, default=datetime.utcnow)

    subscriptions = relationship("Subscription", back_populates="user")

class MembershipTier(Base):
    __tablename__ = "membership_tiers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id"), index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    stripe_product_id = Column(String, nullable=True)
    stripe_price_id = Column(String, nullable=True)

    subscriptions = relationship("Subscription", back_populates="tier")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id"), index=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tier_id = Column(UUID(as_uuid=True), ForeignKey("membership_tiers.id"), nullable=False)
    
    stripe_subscription_id = Column(String, nullable=True)
    status = Column(String, default="active") # active, past_due, canceled
    current_period_end = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="subscriptions")
    tier = relationship("MembershipTier", back_populates="subscriptions")
