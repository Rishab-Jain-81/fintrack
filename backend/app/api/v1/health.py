from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.health import HealthCheckResponse, ServiceStatus

router = APIRouter(tags=["Health"])


@router.get(
    "/healthz",
    response_model=HealthCheckResponse,
    summary="Active system health check",
)
async def health_check(
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    db_status = ServiceStatus(status="healthy")
    redis_status = ServiceStatus(status="healthy")
    is_healthy = True

    try:
        await db.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001
        redis_status = ServiceStatus(status="unhealthy", details=str(exc))
        is_healthy = False

    response_payload = HealthCheckResponse(
        status="healthy" if is_healthy else "unhealthy",
        database=db_status,
        redis=redis_status,
    )

    http_status = (
        status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    )
    return JSONResponse(status_code=http_status, content=response_payload.model_dump())
