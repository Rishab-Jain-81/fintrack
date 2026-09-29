import uuid

from sqlalchemy import CheckConstraint, ForeignKey, Index, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class Category(Base, TimestampMixin, UUIDMixin):
    __tablename__ = "categories"

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    type: Mapped[str] = mapped_column(String(10), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    color: Mapped[str | None] = mapped_column(String(7), nullable=True)

    # relationship
    user: Mapped["User"] = relationship()  # pyright: ignore[reportUndefinedVariable] # noqa: F821

    __table_args__ = (
        CheckConstraint("type IN ('income', 'expense')", name="check_category_type"),
        Index(
            "uq_system_category_name_type",
            "name",
            "type",
            unique=True,
            postgresql_where=(user_id.is_(None)),
        ),
    )
