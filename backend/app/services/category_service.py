"""Business logic for Category operations."""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category, DEFAULT_CATEGORIES
from app.schemas.category import CategoryCreate, CategoryUpdate


async def get_categories(db: AsyncSession) -> list[Category]:
    result = await db.execute(select(Category).order_by(Category.name))
    return list(result.scalars().all())


async def get_category(db: AsyncSession, category_id: int) -> Category:
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


async def create_category(db: AsyncSession, data: CategoryCreate) -> Category:
    category = Category(**data.model_dump(), is_default=False)
    db.add(category)
    await db.flush()
    return category


async def update_category(db: AsyncSession, category_id: int, data: CategoryUpdate) -> Category:
    category = await get_category(db, category_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    await db.flush()
    return category


async def delete_category(db: AsyncSession, category_id: int) -> None:
    category = await get_category(db, category_id)

    if category.is_default:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a default category",
        )

    # Check for linked transactions
    from app.models.transaction import Transaction

    result = await db.execute(
        select(Transaction.id).where(Transaction.category_id == category_id).limit(1)
    )
    if result.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete category with existing transactions",
        )

    await db.delete(category)
    await db.flush()


async def seed_default_categories(db: AsyncSession) -> None:
    """Insert default categories if the table is empty.

    Called on app startup to ensure the base set of categories exists.
    """
    result = await db.execute(select(Category.id).limit(1))
    if result.first():
        return  # Categories already exist

    for cat_data in DEFAULT_CATEGORIES:
        category = Category(**cat_data, is_default=True)
        db.add(category)

    await db.flush()
