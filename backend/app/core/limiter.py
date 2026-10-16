from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

is_test_env = settings.environment.lower() == "test"

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.redis_url,
    enabled=not is_test_env,
    headers_enabled=False,
    default_limits=["100/minute"],
)
