from pydantic import BaseModel


class ServiceStatus(BaseModel):
    status: str
    details: str | None = None


class HealthCheckResponse(BaseModel):
    status: str
    database: ServiceStatus
    redis: ServiceStatus
