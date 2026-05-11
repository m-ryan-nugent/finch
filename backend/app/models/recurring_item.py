"""RecurringItem model — a bill or income that repeats on a schedule.

When a recurring item's next_due_date arrives, the app generates a pending
transaction from it and advances the due date based on the frequency.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.category import Category


class RecurringItem(Base):
    __tablename__ = "recurring_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    frequency: Mapped[str] = mapped_column(
        String(50),
        CheckConstraint(
            "frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'annually')",
            name="ck_recurring_items_frequency",
        ),
    )
    next_due_date: Mapped[date] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # The type of transaction to create (income or expense)
    type: Mapped[str] = mapped_column(
        String(50),
        CheckConstraint(
            "type IN ('income', 'expense')",
            name="ck_recurring_items_type",
        ),
        default="expense",
    )

    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    account: Mapped["Account"] = relationship()
    category: Mapped["Category"] = relationship()
