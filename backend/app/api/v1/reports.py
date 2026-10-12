from datetime import datetime
from decimal import ROUND_HALF_UP, Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.report import CategoryBreakdownItem, FinancialSummaryResponse

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get(
    "/summary",
    response_model=FinancialSummaryResponse,
    summary="Get financial summary and category breakdown",
)
async def get_financial_summary(
    start_date: datetime = Query(..., description="Start of date range (UTC)"),  # noqa: B008
    end_date: datetime = Query(..., description="End of date range (UTC)"),  # noqa: B008
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> FinancialSummaryResponse:

    totals_query = (
        select(
            Transaction.type,
            func.coalesce(func.sum(Transaction.amount), Decimal("0.00")).label("total"),
        )
        .where(
            Transaction.user_id == current_user.id,
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date,
        )
        .group_by(Transaction.type)
    )
    totals_result = await db.execute(totals_query)
    totals_map = {row.type: row.total for row in totals_result.all()}

    total_income = totals_map.get("income", Decimal("0.00"))
    total_expense = totals_map.get("expense", Decimal("0.00"))
    net_savings = total_income - total_expense

    category_query = (
        select(
            Category.id.label("category_id"),
            Category.name.label("category_name"),
            Category.color.label("category_color"),
            Category.icon.label("category_icon"),
            func.coalesce(func.sum(Transaction.amount), Decimal("0.00")).label(
                "amount"
            ),
        )
        .join(Category, Transaction.category_id == Category.id)
        .where(
            Transaction.user_id == current_user.id,
            Transaction.type == "expense",
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date,
        )
        .group_by(Category.id, Category.name, Category.color, Category.icon)
        .order_by(func.sum(Transaction.amount).desc())
    )
    category_result = await db.execute(category_query)
    category_rows = category_result.all()

    breakdown: list[CategoryBreakdownItem] = []

    for row in category_rows:
        if total_expense > Decimal("0.00"):
            # Compute percentage with exact two-decimal precision
            raw_pct = (row.amount / total_expense) * Decimal(100)
            percentage = raw_pct.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        else:
            percentage = Decimal("0.00")

        breakdown.append(
            CategoryBreakdownItem(
                category_id=row.category_id,
                category_name=row.category_name,
                category_color=row.category_color,
                category_icon=row.category_icon,
                amount=row.amount,
                percentage=percentage,
            )
        )

    return FinancialSummaryResponse(
        start_date=start_date,
        end_date=end_date,
        total_income=total_income,
        total_expense=total_expense,
        net_savings=net_savings,
        breakdown_by_category=breakdown,
    )
