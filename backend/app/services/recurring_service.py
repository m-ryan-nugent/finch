"""Business logic for RecurringItem operations.

Recurring items generate pending transactions when their next_due_date arrives.
After generation, the due date advances based on the item's frequency.
"""

from datetime import date, timedelta

from dateutil.relativedelta import relativedelta
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.recurring_item import RecurringItem
from app.models.transaction import Transaction
from app.models.enums import Frequency
from app.schemas.recurring_item import RecurringItemCreate, RecurringItemUpdate
from app.services.account_service import get_account


async def get_recurring_items(db: AsyncSession) -> list[RecurringItem]:
    result = await db.execute(select(RecurringItem).order_by(RecurringItem.next_due_date))
    return list(result.scalars().all())


async def get_recurring_item(db: AsyncSession, item_id: int) -> RecurringItem:
    item = await db.get(RecurringItem, item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recurring item not found"
        )
    return item


async def create_recurring_item(db: AsyncSession, data: RecurringItemCreate) -> RecurringItem:
    # Validate FK references
    await get_account(db, data.account_id)
    from app.services.category_service import get_category

    await get_category(db, data.category_id)

    item = RecurringItem(**data.model_dump())
    db.add(item)
    await db.flush()
    return item


async def update_recurring_item(
    db: AsyncSession, item_id: int, data: RecurringItemUpdate
) -> RecurringItem:
    item = await get_recurring_item(db, item_id)
    update_data = data.model_dump(exclude_unset=True)

    if "account_id" in update_data:
        await get_account(db, update_data["account_id"])
    if "category_id" in update_data:
        from app.services.category_service import get_category

        await get_category(db, update_data["category_id"])

    for field, value in update_data.items():
        setattr(item, field, value)

    await db.flush()
    await db.refresh(item)
    return item


async def delete_recurring_item(db: AsyncSession, item_id: int) -> None:
    item = await get_recurring_item(db, item_id)
    await db.delete(item)
    await db.flush()


async def generate_transaction_from_recurring(
    db: AsyncSession, item_id: int
) -> Transaction:
    """Create a pending transaction from a recurring item and advance its due date."""
    item = await get_recurring_item(db, item_id)

    if not item.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot generate transaction from inactive recurring item",
        )

    transaction = Transaction(
        date=item.next_due_date,
        amount=item.amount,
        type=item.type,
        account_id=item.account_id,
        category_id=item.category_id,
        description=f"Recurring: {item.name}",
        is_pending=True,
    )
    db.add(transaction)

    # Advance the due date based on frequency
    item.next_due_date = _advance_date(item.next_due_date, Frequency(item.frequency))
    await db.flush()

    return transaction


async def generate_all_due(db: AsyncSession) -> list[Transaction]:
    """Generate pending transactions for all active items whose due date has arrived.

    Called on app startup and can be triggered manually via the API.
    """
    today = date.today()
    result = await db.execute(
        select(RecurringItem).where(
            RecurringItem.is_active == True,  # noqa: E712 — SQLAlchemy requires == for column comparison
            RecurringItem.next_due_date <= today,
        )
    )
    due_items = result.scalars().all()

    generated = []
    for item in due_items:
        # Generate transactions for each missed period (handles gaps if app was down)
        while item.next_due_date <= today:
            transaction = Transaction(
                date=item.next_due_date,
                amount=item.amount,
                type=item.type,
                account_id=item.account_id,
                category_id=item.category_id,
                description=f"Recurring: {item.name}",
                is_pending=True,
            )
            db.add(transaction)
            generated.append(transaction)
            item.next_due_date = _advance_date(
                item.next_due_date, Frequency(item.frequency)
            )

    await db.flush()
    return generated


def _advance_date(current: date, frequency: Frequency) -> date:
    """Calculate the next due date based on frequency.

    Uses python-dateutil's relativedelta for month/quarter/year arithmetic
    because naive month addition can overflow (e.g., Jan 31 + 1 month).
    relativedelta handles this by clamping to the last valid day.
    """
    match frequency:
        case Frequency.WEEKLY:
            return current + timedelta(weeks=1)
        case Frequency.BIWEEKLY:
            return current + timedelta(weeks=2)
        case Frequency.MONTHLY:
            return current + relativedelta(months=1)
        case Frequency.QUARTERLY:
            return current + relativedelta(months=3)
        case Frequency.ANNUALLY:
            return current + relativedelta(years=1)
