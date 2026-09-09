from contextvars import ContextVar
from typing import Optional
import uuid

# Context variables to hold tenant context for the duration of a request
tenant_id_var: ContextVar[Optional[uuid.UUID]] = ContextVar("tenant_id", default=None)
bypass_rls_var: ContextVar[bool] = ContextVar("bypass_rls", default=False)
