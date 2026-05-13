"""Business logic for Account operations."""

from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.enums import ASSET_ACCOUNT_TYPES, LIABILITY_ACCOUNT_TYPES, AccountType
from app.schemas.account import AccountCreate, AccountListResponse, AccountUpdate


async def get_accounts(db: AsyncSession) -> AccountListResponse:
    """List all accounts and compute net worth summary."""
    result = await db.execute(select(Account).order_by(Account.name))
    accounts = list(result.scalars().all())

    total_assets = Decimal("0.00")
    total_liabilities = Decimal("0.00")

    for account in accounts:
        if AccountType(account.type) in ASSET_ACCOUNT_TYPES:
            total_assets += account.balance
        elif AccountType(account.type) in LIABILITY_ACCOUNT_TYPES:
            total_liabilities += account.balance

    return AccountListResponse(
        accounts=accounts,
        total_assets=total_assets,
        total_liabilities=total_liabilities,
        net_worth=total_assets - total_liabilities,
    )


async def get_account(db: AsyncSession, account_id: int) -> Account:
    """Fetch a single account by ID, or raise 404."""
    account = await db.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account


async def create_account(db: AsyncSession, data: AccountCreate) -> Account:
    account = Account(**data.model_dump())
    db.add(account)
    await db.flush()
    return account


async def update_account(db: AsyncSession, account_id: int, data: AccountUpdate) -> Account:
    account = await get_account(db, account_id)

    # exclude_unset=True gives PATCH semantics: only update fields the client sent,
    # leaving all other fields at their current values
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(account, field, value)

    await db.flush()
    return account


async def delete_account(db: AsyncSession, account_id: int) -> None:
    account = await get_account(db, account_id)

    # Check for linked transactions before deleting. Transfers reference accounts
    # from both the source and destination columns.
    from app.models.transaction import Transaction

    result = await db.execute(
        select(Transaction.id)
        .where(
            or_(
                Transaction.account_id == account_id,
                Transaction.transfer_to_account_id == account_id,
            )
        )
        .limit(1)
    )
    if result.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete account with existing transactions",
        )

    await db.delete(account)
    await db.flush()


async def adjust_balance(
    db: AsyncSession, account_id: int, amount: Decimal, add: bool
) -> None:
    """Add or subtract from an account's balance.

    Used by the transaction service when creating/updating/deleting transactions
    to keep account balances in sync.

    Liability accounts (credit card, loan) store balance as the amount owed, so
    the direction is flipped: "adding money" (e.g. a payment) reduces the balance,
    and "spending" (e.g. a purchase) increases it.
    """
    account = await get_account(db, account_id)
    is_liability = AccountType(account.type) in LIABILITY_ACCOUNT_TYPES
    if is_liability:
        add = not add
    if add:
        account.balance += amount
    else:
        account.balance -= amount
    await db.flush()
