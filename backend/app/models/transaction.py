import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Transaction(Base, TimestampMixin, UUIDMixin):
    __tablename__ = "transactions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    type: Mapped[str] = mapped_column(String(10), nullable=False)
    transaction_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)

    # relationships
    user: Mapped["User"] = relationship()  # pyright: ignore[reportUndefinedVariable] # noqa: F821
    category: Mapped["Category"] = relationship()  # pyright: ignore[reportUndefinedVariable]  # noqa: F821

    __table_args__ = (
        CheckConstraint("amount > 0", name="valid_transaction_amount"),
        CheckConstraint("type IN ('income', 'expense')", name="check_transaction_type"),
        Index("ix_transactions_user_date", "user_id", transaction_date.desc()),
        Index(
            "ix_transactions_user_category_date",
            "user_id",
            "category_id",
            "transaction_date",
        ),
    )
