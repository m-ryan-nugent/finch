"""Business logic for Budget operations."""

from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import extract, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.budget import Budget
from app.models.enums import TransactionType
from app.models.transaction import Transaction
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetWithActual


async def get_budgets_with_actual(
    db: AsyncSession, month: int, year: int
) -> list[BudgetWithActual]:
    """Fetch budgets for a month and join with actual spending per category.

    Uses a LEFT JOIN against a subquery that sums expense transactions per
    category for the given month. This gives us budget vs. actual in one query.
    """
    # Subquery: total expense amount per category for the given month
    expense_subquery = (
        select(
            Transaction.category_id,
            func.coalesce(func.sum(Transaction.amount), 0).label("total_spent"),
        )
        .where(
            Transaction.type == TransactionType.EXPENSE.value,
            extract("month", Transaction.date) == month,
            extract("year", Transaction.date) == year,
        )
        .group_by(Transaction.category_id)
        .subquery()
    )

    # Main query: budgets LEFT JOIN expense totals
    query = (
        select(Budget, func.coalesce(expense_subquery.c.total_spent, 0).label("actual_spent"))
        .outerjoin(expense_subquery, Budget.category_id == expense_subquery.c.category_id)
        .where(Budget.month == month, Budget.year == year)
        .order_by(Budget.category_id)
    )

    result = await db.execute(query)
    rows = result.all()

    budgets_with_actual = []
    for budget, actual_spent in rows:
        actual = Decimal(str(actual_spent))
        budgets_with_actual.append(
            BudgetWithActual(
                id=budget.id,
                category_id=budget.category_id,
                month=budget.month,
                year=budget.year,
                amount=budget.amount,
                actual_spent=actual,
                remaining=budget.amount - actual,
                created_at=budget.created_at,
                updated_at=budget.updated_at,
            )
        )

    return budgets_with_actual


async def get_budget(db: AsyncSession, budget_id: int) -> Budget:
    budget = await db.get(Budget, budget_id)
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return budget


async def create_budget(db: AsyncSession, data: BudgetCreate) -> Budget:
    # Validate category exists
    from app.services.category_service import get_category

    await get_category(db, data.category_id)

    budget = Budget(**data.model_dump())
    db.add(budget)

    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Budget already exists for category {data.category_id} "
            f"in {data.month}/{data.year}",
        )

    return budget


async def update_budget(db: AsyncSession, budget_id: int, data: BudgetUpdate) -> Budget:
    budget = await get_budget(db, budget_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(budget, field, value)
    await db.flush()
    await db.refresh(budget)
    return budget


async def delete_budget(db: AsyncSession, budget_id: int) -> None:
    budget = await get_budget(db, budget_id)
    await db.delete(budget)
    await db.flush()
