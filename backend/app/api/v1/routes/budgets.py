"""Budget endpoints — CRUD with budget-vs-actual reporting."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetUpdate, BudgetWithActual
from app.services import budget_service

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("/", response_model=list[BudgetWithActual])
async def list_budgets(
    month: int = Query(ge=1, le=12),
    year: int = Query(ge=2000),
    db: AsyncSession = Depends(get_db),
):
    """List budgets for a month with actual spending per category."""
    return await budget_service.get_budgets_with_actual(db, month, year)


@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(data: BudgetCreate, db: AsyncSession = Depends(get_db)):
    return await budget_service.create_budget(db, data)


@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(budget_id: int, db: AsyncSession = Depends(get_db)):
    return await budget_service.get_budget(db, budget_id)


@router.patch("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: int, data: BudgetUpdate, db: AsyncSession = Depends(get_db)
):
    return await budget_service.update_budget(db, budget_id, data)


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(budget_id: int, db: AsyncSession = Depends(get_db)):
    await budget_service.delete_budget(db, budget_id)
