from datetime import datetime
from decimal import ROUND_HALF_UP, Decimal

from celery.result import AsyncResult
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.limiter import limiter
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.report import (
    CategoryBreakdownItem,
    ExportTaskResponse,
    FinancialSummaryResponse,
)
from app.tasks.celery_app import celery_app
from app.tasks.export_task import export_transactions_csv

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

    # 1. Totals Query
    totals_query = (
        select(
            Transaction.type,
            func.coalesce(func.sum(Transaction.amount), 0).label("total"),
        )
        .where(
            Transaction.user_id == current_user.id,
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date,
        )
        .group_by(Transaction.type)
    )
    totals_result = await db.execute(totals_query)
    totals_map = {row.type: Decimal(str(row.total)) for row in totals_result.all()}

    total_income = totals_map.get("income", Decimal("0.00"))
    total_expense = totals_map.get("expense", Decimal("0.00"))
    net_savings = total_income - total_expense

    # 2. Category Breakdown Query
    total_spent_col = func.coalesce(func.sum(Transaction.amount), 0).label("amount")

    category_query = (
        select(
            Category.id.label("category_id"),
            Category.name.label("category_name"),
            Category.color.label("category_color"),
            Category.icon.label("category_icon"),
            total_spent_col,
        )
        .join(Category, Transaction.category_id == Category.id)
        .where(
            Transaction.user_id == current_user.id,
            Transaction.type == "expense",
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date,
        )
        .group_by(Category.id, Category.name, Category.color, Category.icon)
        .order_by(desc(total_spent_col))
    )
    category_result = await db.execute(category_query)
    category_rows = category_result.all()

    breakdown: list[CategoryBreakdownItem] = []

    for row in category_rows:
        amount_decimal = Decimal(str(row.amount))
        if total_expense > Decimal("0.00"):
            raw_pct = (amount_decimal / total_expense) * Decimal(100)
            percentage = raw_pct.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        else:
            percentage = Decimal("0.00")

        breakdown.append(
            CategoryBreakdownItem(
                category_id=row.category_id,
                category_name=row.category_name,
                category_color=row.category_color,
                category_icon=row.category_icon,
                amount=amount_decimal,
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


@router.post(
    "/export",
    status_code=status.HTTP_202_ACCEPTED,
    summary="export report in different formats(csv, etc...)",
)
@limiter.limit("3/minute;10/hour;25/day")
async def export_reports_csv(
    request: Request,
    start_date: datetime = Query(..., description="Start of date range (UTC)"),  # noqa: B008
    end_date: datetime = Query(..., description="End of date range (UTC)"),  # noqa: B008
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> ExportTaskResponse:

    task = export_transactions_csv.delay(
        str(current_user.id),
        start_date.isoformat(),
        end_date.isoformat(),
    )

    return ExportTaskResponse(task_id=task.id, status=task.status)


@router.get(
    "/export/{task_id}",
    summary="check export status & download if status success",
)
async def get_export_status(
    task_id: str,
    current_user: User = Depends(get_current_user),  # noqa: B008
) -> Response:
    task_result = AsyncResult(task_id, app=celery_app)
    if task_result.status == "FAILURE":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Export generation failed.",
        )
    if task_result.status == "PENDING" or task_result.status == "STARTED":
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"task_id": task_id, "status": task_result.status},
        )

    if task_result.status == "SUCCESS":
        return Response(
            content=task_result.result,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=transactions_export_{task_id}.csv"
            },
        )
