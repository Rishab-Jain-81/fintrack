import calendar
import uuid
from collections.abc import Sequence
from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.budget import (
    BudgetCreate,
    BudgetProgressResponse,
    BudgetResponse,
    BudgetUpdate,
)

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.post(
    "",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a budget",
)
async def create_budget(
    budget_in: BudgetCreate,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> Budget:

    query = select(Category).where(
        Category.id == budget_in.category_id,
        or_(Category.user_id == current_user.id, Category.user_id.is_(None)),
    )
    result = await db.execute(query)
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="category not found",
        )

    if category.type != "expense":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Budgets can only be created for expense categories.",
        )

    conflict_query = select(Budget).where(
        Budget.user_id == current_user.id,
        Budget.category_id == budget_in.category_id,
        Budget.month == budget_in.month,
        Budget.year == budget_in.year,
    )
    conf_result = await db.execute(conflict_query)

    if conf_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A budget for this category in {budget_in.month}/{budget_in.year} already exists.",
        )

    budget = Budget(
        user_id=current_user.id,
        **budget_in.model_dump(),
    )

    db.add(budget)
    await db.commit()
    await db.refresh(budget)

    return budget


@router.get(
    "",
    response_model=list[BudgetProgressResponse],
    summary="see budgets with live progress.",
)
async def get_budgets(
    month: int | None = Query(default=None, ge=1, le=12),
    year: int | None = Query(default=None, ge=2000, le=2100),
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> Sequence[BudgetProgressResponse]:

    now = datetime.now(timezone.utc)
    target_month = month or now.month
    target_year = year or now.year

    start_date = datetime(
        target_year,
        target_month,
        1,
        0,
        0,
        0,
        tzinfo=timezone.utc,
    )
    _, last_day = calendar.monthrange(target_year, target_month)
    end_date = datetime(
        target_year,
        target_month,
        last_day,
        23,
        59,
        59,
        999999,
        tzinfo=timezone.utc,
    )

    budget_query = (
        select(Budget, Category)
        .join(Category, Budget.category_id == Category.id)
        .where(
            Budget.user_id == current_user.id,
            Budget.month == target_month,
            Budget.year == target_year,
        )
    )
    budget_result = await db.execute(budget_query)
    budget_rows = budget_result.all()

    amounts_query = (
        select(
            Transaction.category_id,
            func.coalesce(func.sum(Transaction.amount), Decimal("0.00")).label(
                "total_spent"
            ),
        )
        .where(
            Transaction.user_id == current_user.id,
            Transaction.type == "expense",
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date,
        )
        .group_by(Transaction.category_id)
    )
    amounts_result = await db.execute(amounts_query)
    amounts_map = {row.category_id: row.total_spent for row in amounts_result.all()}

    budgets: list[BudgetProgressResponse] = []

    for budget, category in budget_rows:
        spent_amount = amounts_map.get(budget.category_id, Decimal("0.00"))
        remaining_amount = budget.amount - spent_amount
        is_over_budget = spent_amount > budget.amount

        if budget.amount > Decimal("0.00"):
            raw_pct = (spent_amount / budget.amount) * Decimal(100)
            percentage_used = raw_pct.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        else:
            percentage_used = Decimal("0.00")

        budgets.append(
            BudgetProgressResponse(
                id=budget.id,
                user_id=budget.user_id,
                created_at=budget.created_at,
                updated_at=budget.updated_at,
                category_id=budget.category_id,
                category_name=category.name,
                category_color=category.color,
                category_icon=category.icon,
                amount=budget.amount,
                month=budget.month,
                year=budget.year,
                spent_amount=spent_amount,
                remaining_amount=remaining_amount,
                percentage_used=percentage_used,
                is_over_budget=is_over_budget,
            )
        )

    return budgets


@router.get(
    "/{budget_id}",
    response_model=BudgetProgressResponse,
    summary="see a budget with live progress",
)
async def get_budget(
    budget_id: uuid.UUID,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> BudgetProgressResponse:
    query = (
        select(Budget, Category)
        .join(Category, Category.id == Budget.category_id)
        .where(
            Budget.user_id == current_user.id,
            Budget.id == budget_id,
        )
    )
    result = await db.execute(query)
    row = result.first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found.",
        )
    budget, category = row

    start_date = datetime(budget.year, budget.month, 1, 0, 0, 0, tzinfo=timezone.utc)
    _, last_day = calendar.monthrange(budget.year, budget.month)
    end_date = datetime(
        budget.year, budget.month, last_day, 23, 59, 59, 999999, tzinfo=timezone.utc
    )

    amount_query = select(
        func.coalesce(func.sum(Transaction.amount), Decimal("0.00")).label(
            "total_spent"
        )
    ).where(
        Transaction.user_id == current_user.id,
        Transaction.category_id == budget.category_id,
        Transaction.type == "expense",
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date,
    )

    amount_result = await db.execute(amount_query)
    spent_amount = amount_result.scalar_one_or_none()

    remaining_amount = budget.amount - spent_amount
    is_over_budget = spent_amount > budget.amount

    if budget.amount > Decimal("0.00"):
        raw_pct = (spent_amount / budget.amount) * Decimal(100)
        percentage_used = raw_pct.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    else:
        percentage_used = Decimal("0.00")

    return BudgetProgressResponse(
        id=budget.id,
        user_id=budget.user_id,
        created_at=budget.created_at,
        updated_at=budget.updated_at,
        category_id=budget.category_id,
        category_name=category.name,
        category_color=category.color,
        category_icon=category.icon,
        amount=budget.amount,
        month=budget.month,
        year=budget.year,
        spent_amount=spent_amount,
        remaining_amount=remaining_amount,
        percentage_used=percentage_used,
        is_over_budget=is_over_budget,
    )


@router.patch(
    "/{budget_id}",
    response_model=BudgetResponse,
    summary="update a budget.",
)
async def update_budget(
    budget_id: uuid.UUID,
    budget_in: BudgetUpdate,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> Budget:

    query = select(Budget).where(
        Budget.user_id == current_user.id,
        Budget.id == budget_id,
    )
    result = await db.execute(query)
    budget = result.scalar_one_or_none()

    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found.",
        )

    update_data = budget_in.model_dump(exclude_unset=True)

    target_month = update_data.get("month", budget.month)
    target_year = update_data.get("year", budget.year)

    if "month" in update_data or "year" in update_data:
        conflict_query = select(Budget).where(
            Budget.user_id == current_user.id,
            Budget.category_id == budget.category_id,
            Budget.month == target_month,
            Budget.year == target_year,
            Budget.id != budget_id,
        )
        conf_result = await db.execute(conflict_query)
        if conf_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A budget for this category in {target_month}/{target_year} already exists.",
            )

    for field, value in update_data.items():
        setattr(budget, field, value)

    await db.commit()
    await db.refresh(budget)

    return budget


@router.delete(
    "/{budget_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a budget."
)
async def delete_budget(
    budget_id: uuid.UUID,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> None:
    query = select(Budget).where(
        Budget.id == budget_id, Budget.user_id == current_user.id
    )
    result = await db.execute(query)
    budget = result.scalar_one_or_none()

    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found."
        )

    await db.delete(budget)
    await db.commit()
