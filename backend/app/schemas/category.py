import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

CategoryType = Literal["income", "expense"]


class CategoryBase(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=64,
        description="Display name for the category (e.g., 'Groceries', 'Salary')",
    )
    type: CategoryType = Field(
        ...,
        description="Category classification: 'income' or 'expense'",
    )
    icon: str | None = Field(
        default=None,
        max_length=50,
        description="Icon identifier or slug for UI rendering (e.g., 'lucide:utensils')",
    )
    color: str | None = Field(
        default=None,
        pattern=r"^#(?:[0-9a-fA-F]{3}){1,2}$",
        description="Hexadecimal color string for charts and UI (e.g., '#10B981')",
    )


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=64)
    type: CategoryType | None = None
    icon: str | None = Field(
        default=None,
        max_length=50,
    )
    color: str | None = Field(
        default=None,
        pattern=r"^#(?:[0-9a-fA-F]{3}){1,2}$",
    )


class CategoryResponse(CategoryBase):
    id: uuid.UUID
    user_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
