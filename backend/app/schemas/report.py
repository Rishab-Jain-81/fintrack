import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CategoryBreakdownItem(BaseModel):
    category_id: uuid.UUID
    category_name: str
    category_color: str | None = None
    category_icon: str | None = None
    amount: Decimal = Field(..., max_digits=12, decimal_places=2)
    percentage: Decimal = Field(
        ..., max_digits=5, decimal_places=2, description="Percentage of total(0 to 100)"
    )


class FinancialSummaryResponse(BaseModel):
    start_date: datetime
    end_date: datetime
    total_income: Decimal = Field(..., max_digits=12, decimal_places=2)
    total_expense: Decimal = Field(..., max_digits=12, decimal_places=2)
    net_savings: Decimal = Field(..., max_digits=12, decimal_places=2)
    breakdown_by_category: list[CategoryBreakdownItem]

    model_config = ConfigDict(from_attributes=True)
