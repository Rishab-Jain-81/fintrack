from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "fintrack_tasks",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    result_expires=86400,
    # Explicitly register task modules by string so Celery imports them safely
    imports=["app.tasks.export_task"],
)

# Tell Celery to autodiscover any tasks inside the app.tasks package
celery_app.autodiscover_tasks(["app.tasks"])
