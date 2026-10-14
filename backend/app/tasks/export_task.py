import asyncio
import csv
import io
import uuid
from datetime import datetime

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.category import Category
from app.models.transaction import Transaction
from app.tasks.celery_app import celery_app


async def _generate_transactions_csv_async(
    user_id_str: str, start_date_str: str, end_date_str: str
) -> str:
    user_id = uuid.UUID(user_id_str)
    start_date = datetime.fromisoformat(start_date_str)
    end_date = datetime.fromisoformat(end_date_str)

    async with AsyncSessionLocal() as session:
        query = (
            select(Transaction, Category.name.label("category_name"))
            .join(Category, Transaction.category_id == Category.id)
            .where(
                Transaction.user_id == user_id,
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date,
            )
            .order_by(Transaction.transaction_date.desc())
        )
        result = await session.execute(query)
        rows = result.all()

        output = io.StringIO()
        writer = csv.writer(output)

        # Write CSV Header
        writer.writerow(
            ["Transaction ID", "Date", "Type", "Category", "Amount", "Description"]
        )

        for tx, category_name in rows:
            writer.writerow(
                [
                    str(tx.id),
                    tx.transaction_date.isoformat(),
                    tx.type,
                    category_name,
                    str(tx.amount),
                    tx.description or "",
                ]
            )

        return output.getvalue()


@celery_app.task(bind=True, name="tasks.export_transactions_csv")
def export_transactions_csv(
    self, user_id_str: str, start_date_str: str, end_date_str: str
) -> str:
    """Synchronous Celery task that drives the async database query."""
    return asyncio.run(
        _generate_transactions_csv_async(user_id_str, start_date_str, end_date_str)
    )
