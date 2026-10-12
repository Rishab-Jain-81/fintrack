import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class BudgetBase(BaseModel):
    category_id: uuid.UUID = Field(
        ...,
        description="Target category UUID",
    )
    amount: Decimal = Field(
        ...,
        gt=0,
        max_digits=12,
        decimal_places=2,
        description="Budget ceiling amount, strictly positive",
    )
    month: int = Field(
        ...,
        ge=1,
        le=12,
        description="Month of budget(1-12)",
    )
    year: int = Field(
        ...,
        ge=2000,
        le=2100,
        description="Year of budget",
    )


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=12,
        decimal_places=2,
    )
    month: int | None = Field(
        default=None,
        ge=1,
        le=12,
    )
    year: int | None = Field(
        default=None,
        ge=2000,
        le=2100,
    )


class BudgetResponse(BudgetBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BudgetProgressResponse(BudgetResponse):
    category_id: uuid.UUID
    category_name: str
    category_color: str | None = None
    category_icon: str | None = None
    amount: Decimal = Field(
        ...,
        gt=0,
        max_digits=12,
        decimal_places=2,
    )
    month: int = Field(
        ...,
        ge=1,
        le=12,
    )
    year: int = Field(
        ...,
        ge=2000,
        le=2100,
    )
    spent_amount: Decimal = Field(
        ...,
        max_digits=12,
        decimal_places=2,
    )
    remaining_amount: Decimal = Field(
        ...,
        max_digits=12,
        decimal_places=2,
    )
    percentage_used: Decimal = Field(..., max_digits=12, decimal_places=2)
    is_over_budget: bool
