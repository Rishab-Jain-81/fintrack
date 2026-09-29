import uuid
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Numeric,
    SmallInteger,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Budget(Base, TimestampMixin, UUIDMixin):
    __tablename__ = "budgets"
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    month: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    year: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    # relationships
    user: Mapped["User"] = relationship()  # pyright: ignore[reportUndefinedVariable] # noqa: F821
    category: Mapped["Category"] = relationship()  # pyright: ignore[reportUndefinedVariable] # noqa: F821

    __table_args__ = (
        CheckConstraint("amount > 0", name="valid_budget_amount"),
        CheckConstraint("month BETWEEN 1 AND 12", name="valid_budget_month"),
        CheckConstraint("year >= 2020", name="valid_budget_year"),
        UniqueConstraint(
            "user_id",
            "category_id",
            "year",
            "month",
            name="uq_user_category_budget_period",
        ),
    )
