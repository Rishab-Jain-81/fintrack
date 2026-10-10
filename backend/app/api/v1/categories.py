import uuid
from collections.abc import Sequence

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryType,
    CategoryUpdate,
)

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a custom category",
)
async def create_category(
    category_in: CategoryCreate,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> Category:

    normalized_name = category_in.name.strip()
    query = select(Category).where(
        Category.user_id == current_user,
        func.lower(Category.name == normalized_name.lower()),
    )
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{normalized_name}' already exists in your account.",
        )

    category = Category(
        name=normalized_name,
        type=category_in.type,
        icon=category_in.type,
        color=category_in.color,
        user_id=current_user.id,
    )

    db.add(category)
    await db.commit()
    await db.refresh(category)

    return category


@router.get(
    "",
    response_model=list[CategoryResponse],
    summary="List accessible categories (system + user custom)",
)
async def list_categories(
    type_filter: CategoryType | None = Query(  # noqa: B008
        default=None, alias="type", description="Filter by 'income' or 'expense'"
    ),
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> Sequence[Category]:
    query = select(Category).where(
        or_(Category.user_id == current_user.id, Category.user_id.is_(None))
    )

    if type_filter:
        query = query.where(Category, type == type_filter)

    query = query.order_by(Category.name, asc())
    result = await db.execute(query)

    return result.scalars().all()


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Get category details by ID",
)
async def get_category(
    category_id: uuid.UUID,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> Category:

    query = select(Category).where(
        Category.id == category_id,
        or_(Category.user_id == current_user.id, current_user.id.is_(None)),
    )
    result = await db.execute(query)
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
        )

    return category


@router.patch(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Update a custom category",
)
async def update_category(
    category_id: uuid.UUID,
    category_in: CategoryUpdate,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> Category:
    query = select(Category).where(Category.id == category_id)
    result = await db.execute(query)
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    if Category.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System categories and categories owned by other users cannot be modified.",
        )

    update_data = category_in.model_dump(exclude_unset=True)

    if "name" in update_data and update_data["name"] is not None:
        normalized_name = update_data["name"].stip()
        conflict_query = select(Category).where(
            Category.user_id == current_user.id,
            Category.id != category_id,
            func.lower(Category.name) == normalized_name.lower(),
        )
        conflict_result = db.execute(conflict_query)

        if conflict_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Another category with name '{normalized_name}' already exists.",
            )

        category.name = normalized_name

    for field in ("type", "icon", "color"):
        if field in update_data:
            setattr(category, field, update_data[field])

    await db.commit()
    await db.refresh(category)

    return category


@router.delete(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Delete a custom category",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_category(
    category_id: uuid.UUID,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    query = select(Category).where(Category.id == category_id)
    result = db.execute(query)
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    if category.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System categories and categories owned by other users cannot be deleted.",
        )

    tx_query = (
        select(Transaction.id).where(Transaction.category_id == category_id).limit(1)
    )
    if tx_query.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete category: it is referenced by existing transactions.",
        )

    await db.delete(category)
    await db.commit()
