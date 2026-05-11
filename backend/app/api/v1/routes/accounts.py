"""Account endpoints — CRUD operations for financial accounts."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.account import (
    AccountCreate,
    AccountListResponse,
    AccountResponse,
    AccountUpdate,
)
from app.services import account_service

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("/", response_model=AccountListResponse)
async def list_accounts(db: AsyncSession = Depends(get_db)):
    return await account_service.get_accounts(db)


@router.post("/", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(data: AccountCreate, db: AsyncSession = Depends(get_db)):
    return await account_service.create_account(db, data)


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(account_id: int, db: AsyncSession = Depends(get_db)):
    return await account_service.get_account(db, account_id)


@router.patch("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: int, data: AccountUpdate, db: AsyncSession = Depends(get_db)
):
    return await account_service.update_account(db, account_id, data)


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(account_id: int, db: AsyncSession = Depends(get_db)):
    await account_service.delete_account(db, account_id)
