"""Transaction endpoints — CRUD, filtering, and monthly summaries."""

from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.enums import TransactionType
from app.schemas.transaction import (
    TransactionCreate,
    TransactionFilter,
    TransactionResponse,
    TransactionSummary,
    TransactionUpdate,
)
from app.services import transaction_service

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/summary", response_model=TransactionSummary)
async def get_monthly_summary(
    month: int = Query(ge=1, le=12),
    year: int = Query(ge=2000),
    db: AsyncSession = Depends(get_db),
):
    """Total income, expenses, and net for a given month."""
    return await transaction_service.get_monthly_summary(db, month, year)


@router.get("/", response_model=list[TransactionResponse])
async def list_transactions(
    account_id: int | None = None,
    category_id: int | None = None,
    type: TransactionType | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    is_pending: bool | None = None,
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    filters = TransactionFilter(
        account_id=account_id,
        category_id=category_id,
        type=type,
        date_from=date_from,
        date_to=date_to,
        is_pending=is_pending,
    )
    return await transaction_service.get_transactions(db, filters, limit, offset)


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(data: TransactionCreate, db: AsyncSession = Depends(get_db)):
    return await transaction_service.create_transaction(db, data)


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: int, db: AsyncSession = Depends(get_db)):
    return await transaction_service.get_transaction(db, transaction_id)


@router.patch("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int, data: TransactionUpdate, db: AsyncSession = Depends(get_db)
):
    return await transaction_service.update_transaction(db, transaction_id, data)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(transaction_id: int, db: AsyncSession = Depends(get_db)):
    await transaction_service.delete_transaction(db, transaction_id)
