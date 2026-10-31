import uuid
from collections.abc import Sequence

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import (
    TransactionCreate,
    TransactionFilterParams,
    TransactionResponse,
    TransactionUpdate,
)

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post(
    "",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Make a trannsaction",
)
async def create_transaction(
    transaction_in: TransactionCreate,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> Transaction:

    query = select(Category).where(
        Category.id == transaction_in.category_id,
        or_(
            Category.user_id == current_user.id,
            Category.user_id.is_(None),
        ),
    )
    result = await db.execute(query)
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    if transaction_in.type != category.type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category type",
        )

    transaction = Transaction(
        user_id=current_user.id,
        **transaction_in.model_dump(),
    )

    db.add(transaction)
    await db.commit()
    await db.refresh(transaction, attribute_names=["category"])

    return transaction


@router.get(
    "",
    response_model=list[TransactionResponse],
    summary="see transactions",
)
async def get_transactions(
    filter: TransactionFilterParams = Depends(),  # noqa: B008
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> Sequence[Transaction]:

    query = (
        select(Transaction)
        .options(selectinload(Transaction.category))
        .where(Transaction.user_id == current_user.id)
    )

    if filter.start_date:
        query = query.where(Transaction.transaction_date >= filter.start_date)

    if filter.end_date:
        query = query.where(Transaction.transaction_date <= filter.end_date)

    if filter.category_id:
        query = query.where(Transaction.category_id == filter.category_id)

    if filter.type:
        query = query.where(Transaction.type == filter.type)

    query = (
        query.order_by(Transaction.transaction_date.desc())
        .offset(filter.offset)
        .limit(filter.limit)
    )

    result = await db.execute(query)
    transactions = result.scalars().all()

    return transactions


@router.get(
    "/{transaction_id}",
    response_model=TransactionResponse,
    summary="see a transaction.",
)
async def get_transaction(
    transaction_id: uuid.UUID,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> Transaction:
    query = (
        select(Transaction)
        .options(selectinload(Transaction.category))
        .where(
            Transaction.user_id == current_user.id,
            Transaction.id == transaction_id,
        )
    )
    result = await db.execute(query)
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found.",
        )

    return transaction


@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a transaction",
)
async def delete_transaction(
    transaction_id: uuid.UUID,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> None:
    query = select(Transaction).where(
        Transaction.user_id == current_user.id,
        Transaction.id == transaction_id,
    )

    result = await db.execute(query)
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found.",
        )

    await db.delete(transaction)
    await db.commit()


@router.patch(
    "/{transaction_id}",
    response_model=TransactionResponse,
    summary="Update a transaction.",
)
async def update_transaction(
    transaction_in: TransactionUpdate,
    transaction_id: uuid.UUID,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> Transaction:
    query = (
        select(Transaction)
        .options(selectinload(Transaction.category))
        .where(
            Transaction.user_id == current_user.id,
            Transaction.id == transaction_id,
        )
    )

    result = await db.execute(query)
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found.",
        )

    update_data = transaction_in.model_dump(exclude_unset=True)

    if not update_data:
        return transaction

    target_category_id = update_data.get("category_id", transaction.category_id)
    target_type = update_data.get("type", transaction.type)

    if "category_id" in update_data or "type" in update_data:
        conflict_query = select(Category).where(
            Category.id == target_category_id,
            or_(Category.user_id == current_user.id, Category.user_id.is_(None)),
        )
        conflict_result = await db.execute(conflict_query)
        category = conflict_result.scalar_one_or_none()

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found.",
            )

        if category.type != target_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category type '{category.type}' does not match transaction type '{target_type}'.",
            )
    for field, value in update_data.items():
        setattr(transaction, field, value)

    await db.commit()
    refreshed_query = (
        select(Transaction)
        .options(selectinload(Transaction.category))
        .where(Transaction.id == transaction_id)
    )
    refreshed_result = await db.execute(refreshed_query)
    return refreshed_result.scalar_one()
