"""Business logic for Transaction operations.

This is the most complex service because every transaction CRUD operation
must also update account balances to keep them in sync.

Balance adjustment rules:
  - income:   add amount to account
  - expense:  subtract amount from account
  - transfer: subtract from source account, add to destination account
"""

from datetime import date
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import TransactionType
from app.models.transaction import Transaction
from app.schemas.transaction import (
    TransactionCreate,
    TransactionFilter,
    TransactionSummary,
    TransactionUpdate,
)
from app.services.account_service import adjust_balance, get_account


async def get_transactions(
    db: AsyncSession,
    filters: TransactionFilter,
    limit: int = 50,
    offset: int = 0,
) -> list[Transaction]:
    """List transactions with optional filters, ordered newest-first."""
    query = select(Transaction).order_by(Transaction.date.desc(), Transaction.id.desc())

    # Build WHERE clauses dynamically from non-None filter values
    if filters.account_id is not None:
        query = query.where(Transaction.account_id == filters.account_id)
    if filters.category_id is not None:
        query = query.where(Transaction.category_id == filters.category_id)
    if filters.type is not None:
        query = query.where(Transaction.type == filters.type.value)
    if filters.date_from is not None:
        query = query.where(Transaction.date >= filters.date_from)
    if filters.date_to is not None:
        query = query.where(Transaction.date <= filters.date_to)
    if filters.is_pending is not None:
        query = query.where(Transaction.is_pending == filters.is_pending)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_transaction(db: AsyncSession, transaction_id: int) -> Transaction:
    """Fetch a single transaction with eager-loaded relationships."""
    # selectinload prevents lazy-load errors in async mode by fetching
    # related objects in the same query batch
    result = await db.execute(
        select(Transaction)
        .options(
            selectinload(Transaction.account),
            selectinload(Transaction.category),
            selectinload(Transaction.transfer_to_account),
        )
        .where(Transaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found"
        )
    return transaction


async def create_transaction(db: AsyncSession, data: TransactionCreate) -> Transaction:
    """Create a transaction and adjust account balance(s)."""
    # Validate referenced accounts and category exist
    await get_account(db, data.account_id)
    if data.transfer_to_account_id is not None:
        await get_account(db, data.transfer_to_account_id)

    from app.services.category_service import get_category

    await get_category(db, data.category_id)

    transaction = Transaction(**data.model_dump())
    db.add(transaction)
    await db.flush()

    await _apply_balance_effects(db, transaction)
    return transaction


async def update_transaction(
    db: AsyncSession, transaction_id: int, data: TransactionUpdate
) -> Transaction:
    """Update a transaction, reversing old balance effects and applying new ones.

    This is a three-step process:
    1. Reverse the balance effects of the current transaction values
    2. Apply the field updates
    3. Apply balance effects with the new values
    """
    transaction = await get_transaction(db, transaction_id)

    # Step 1: reverse current balance effects before changing anything
    await _reverse_balance_effects(db, transaction)

    # Step 2: apply field updates
    update_data = data.model_dump(exclude_unset=True)

    # Validate new references if they're changing
    if "account_id" in update_data:
        await get_account(db, update_data["account_id"])
    if "transfer_to_account_id" in update_data and update_data["transfer_to_account_id"]:
        await get_account(db, update_data["transfer_to_account_id"])
    if "category_id" in update_data:
        from app.services.category_service import get_category

        await get_category(db, update_data["category_id"])

    for field, value in update_data.items():
        setattr(transaction, field, value)

    # Validate transfer fields after applying updates
    if transaction.type == TransactionType.TRANSFER.value:
        if not transaction.transfer_to_account_id:
            raise ValueError("transfer_to_account_id is required for transfers")
        if transaction.transfer_to_account_id == transaction.account_id:
            raise ValueError("Cannot transfer to the same account")
    else:
        transaction.transfer_to_account_id = None

    await db.flush()

    # Step 3: apply new balance effects
    await _apply_balance_effects(db, transaction)
    await db.refresh(transaction)
    return transaction


async def delete_transaction(db: AsyncSession, transaction_id: int) -> None:
    """Delete a transaction and reverse its balance effects."""
    transaction = await get_transaction(db, transaction_id)
    await _reverse_balance_effects(db, transaction)
    await db.delete(transaction)
    await db.flush()


async def get_monthly_summary(
    db: AsyncSession, month: int, year: int
) -> TransactionSummary:
    """Calculate total income, expenses, and net for a given month.

    Transfers are excluded — they move money between accounts but don't
    represent income or spending.
    """
    # Sum income transactions for the month
    income_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.type == TransactionType.INCOME.value,
            extract("month", Transaction.date) == month,
            extract("year", Transaction.date) == year,
        )
    )
    total_income = Decimal(str(income_result.scalar()))

    # Sum expense transactions for the month
    expense_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.type == TransactionType.EXPENSE.value,
            extract("month", Transaction.date) == month,
            extract("year", Transaction.date) == year,
        )
    )
    total_expenses = Decimal(str(expense_result.scalar()))

    return TransactionSummary(
        month=month,
        year=year,
        total_income=total_income,
        total_expenses=total_expenses,
        net=total_income - total_expenses,
    )


# --- Internal helpers ---


async def _apply_balance_effects(db: AsyncSession, transaction: Transaction) -> None:
    """Adjust account balances based on transaction type."""
    txn_type = TransactionType(transaction.type)

    if txn_type == TransactionType.INCOME:
        await adjust_balance(db, transaction.account_id, transaction.amount, add=True)

    elif txn_type == TransactionType.EXPENSE:
        await adjust_balance(db, transaction.account_id, transaction.amount, add=False)

    elif txn_type == TransactionType.TRANSFER:
        # Subtract from source, add to destination
        await adjust_balance(db, transaction.account_id, transaction.amount, add=False)
        await adjust_balance(
            db, transaction.transfer_to_account_id, transaction.amount, add=True
        )


async def _reverse_balance_effects(db: AsyncSession, transaction: Transaction) -> None:
    """Undo the balance changes from a transaction (for updates and deletes)."""
    txn_type = TransactionType(transaction.type)

    if txn_type == TransactionType.INCOME:
        await adjust_balance(db, transaction.account_id, transaction.amount, add=False)

    elif txn_type == TransactionType.EXPENSE:
        await adjust_balance(db, transaction.account_id, transaction.amount, add=True)

    elif txn_type == TransactionType.TRANSFER:
        # Reverse: add back to source, subtract from destination
        await adjust_balance(db, transaction.account_id, transaction.amount, add=True)
        await adjust_balance(
            db, transaction.transfer_to_account_id, transaction.amount, add=False
        )
