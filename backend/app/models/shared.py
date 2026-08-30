import uuid
from sqlalchemy import Column, String, DateTime, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.db.base_class import Base

class Tenant(Base):
    """
    Tenant model stored in the shared 'public' schema.
    """
    __tablename__ = "tenants"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    subdomain = Column(String, unique=True, index=True, nullable=False)
    schema_name = Column(String, unique=True, nullable=False)
    
    # Plan and Status
    plan = Column(String, default="free", nullable=False) # free, pro, enterprise
    status = Column(String, default="active", nullable=False) # active, suspended
    rate_limit_per_minute = Column(Integer, default=100, nullable=False)
    
    # Integrations
    stripe_account_id = Column(String, nullable=True)
    salesforce_refresh_token = Column(String, nullable=True)
    salesforce_instance_url = Column(String, nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
