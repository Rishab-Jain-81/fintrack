from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1 import api_router
from app.core.config import settings
from app.core.limiter import limiter

app = FastAPI()

app.include_router(api_router, prefix=settings.api_v1_str)


def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded) -> Response:
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."},
    )


app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    custom_rate_limit_handler,
)
app.add_middleware(SlowAPIMiddleware)
