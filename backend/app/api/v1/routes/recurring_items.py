"""RecurringItem endpoints — CRUD and transaction generation."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.recurring_item import (
    RecurringItemCreate,
    RecurringItemResponse,
    RecurringItemUpdate,
)
from app.schemas.transaction import TransactionResponse
from app.services import recurring_service

router = APIRouter(prefix="/recurring-items", tags=["recurring items"])


@router.get("/", response_model=list[RecurringItemResponse])
async def list_recurring_items(db: AsyncSession = Depends(get_db)):
    return await recurring_service.get_recurring_items(db)


@router.post("/", response_model=RecurringItemResponse, status_code=status.HTTP_201_CREATED)
async def create_recurring_item(
    data: RecurringItemCreate, db: AsyncSession = Depends(get_db)
):
    return await recurring_service.create_recurring_item(db, data)


@router.post("/generate-due", response_model=list[TransactionResponse])
async def generate_due_recurring(db: AsyncSession = Depends(get_db)):
    """Generate pending transactions for all active items whose due date has passed."""
    return await recurring_service.generate_all_due(db)


@router.get("/{item_id}", response_model=RecurringItemResponse)
async def get_recurring_item(item_id: int, db: AsyncSession = Depends(get_db)):
    return await recurring_service.get_recurring_item(db, item_id)


@router.patch("/{item_id}", response_model=RecurringItemResponse)
async def update_recurring_item(
    item_id: int, data: RecurringItemUpdate, db: AsyncSession = Depends(get_db)
):
    return await recurring_service.update_recurring_item(db, item_id, data)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recurring_item(item_id: int, db: AsyncSession = Depends(get_db)):
    await recurring_service.delete_recurring_item(db, item_id)


@router.post("/{item_id}/generate", response_model=TransactionResponse)
async def generate_single(item_id: int, db: AsyncSession = Depends(get_db)):
    """Generate a pending transaction from a specific recurring item."""
    return await recurring_service.generate_transaction_from_recurring(db, item_id)
