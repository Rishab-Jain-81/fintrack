import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

TransactionType = Literal["income", "expense"]


class TransactionBase(BaseModel):
    amount: Decimal = (
        Field(
            ...,
            gt=0,
            max_digits=12,
            decimal_places=2,
            description="Transaction amount, must be positive with at most 2 decimal places",
        ),
    )
    type: TransactionType = (
        Field(..., description="Flow of funds: 'income' or 'expense'"),
    )
    description: str | None = (
        Field(
            default=None,
            max_length=255,
            description="Optional human-redable memo or note",
        ),
    )
    transaction_date: datetime = Field(
        ...,
        description="UTC timestamp when the transaction occurred",
    )
    category_id: uuid.UUID = Field(
        ...,
        description="Target category UUID",
    )


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    amount: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=12,
        decimal_places=2,
    )
    type: TransactionType | None = None
    description: str | None = Field(
        default=None,
        max_length=255,
    )
    transaction_date: datetime | None = None
    category_id: uuid.UUID | None = None


class TransactionResponse(TransactionBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionFilterParams(BaseModel):
    start_date: datetime | None = None
    end_date: datetime | None = None
    category_id: uuid.UUID | None = None
    type: TransactionType | None = None
    limit: int = Field(default=20, ge=0, le=100)
    offset: int = Field(default=0, ge=0)
