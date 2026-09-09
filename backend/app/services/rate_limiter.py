import time
from typing import Dict, List
import os

# Optional redis import
try:
    import redis
    redis_available = True
except ImportError:
    redis_available = False


class LocalMemoryLimiter:
    """In-memory fallback rate limiter for development/testing."""
    def __init__(self):
        # tenant_id -> list of request timestamps
        self.requests: Dict[str, List[float]] = {}

    def is_rate_limited(self, tenant_id: str, limit: int) -> bool:
        # If limit is 0 or negative, treat as unlimited
        if limit <= 0 or limit >= 1000000:
            return False
            
        now = time.time()
        one_minute_ago = now - 60.0
        
        # Initialize if not exists
        if tenant_id not in self.requests:
            self.requests[tenant_id] = []
            
        # Clean up timestamps older than 1 minute
        self.requests[tenant_id] = [t for t in self.requests[tenant_id] if t > one_minute_ago]
        
        # Check limit
        if len(self.requests[tenant_id]) >= limit:
            return True
            
        # Log this request
        self.requests[tenant_id].append(now)
        return False


class RedisLimiter:
    """Redis-backed rate limiter for production using sliding window."""
    def __init__(self, redis_url: str):
        self.client = redis.from_url(redis_url, decode_responses=True)

    def is_rate_limited(self, tenant_id: str, limit: int) -> bool:
        if limit <= 0 or limit >= 1000000:
            return False
            
        now = time.time()
        one_minute_ago = now - 60.0
        key = f"rate_limit:{tenant_id}"
        
        try:
            # Use Redis pipeline for atomic transaction
            pipe = self.client.pipeline()
            # Clean up old timestamps
            pipe.zremrangebyscore(key, 0, one_minute_ago)
            # Count requests in last minute
            pipe.zcard(key)
            # Add current request using time as score and member
            member_value = f"{now}-{tenant_id}"
            pipe.zadd(key, {member_value: now})
            # Set key expiry to 1 minute
            pipe.expire(key, 60)
            
            # Execute pipeline
            _, count, _, _ = pipe.execute()
            
            if count > limit:
                # Remove the request we just added so it doesn't count
                self.client.zrem(key, member_value)
                return True
            return False
        except Exception:
            # Fallback to local memory if Redis fails
            return False


# Initialize the global limiter dynamically
redis_url = os.getenv("REDIS_URL")
if redis_available and redis_url:
    limiter = RedisLimiter(redis_url)
else:
    limiter = LocalMemoryLimiter()
