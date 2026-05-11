"""Transaction model — a single financial event (income, expense, or transfer).

Amount is always stored as a positive number. The `type` field determines
whether it adds to or subtracts from account balances. Transfers are neutral —
they move money between accounts but don't count as income or expense.
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


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Date (not DateTime) — personal finance tracks at day granularity
    date: Mapped[date] = mapped_column(Date)
    # Always positive; type field determines the direction of money flow
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    type: Mapped[str] = mapped_column(
        String(50),
        CheckConstraint(
            "type IN ('income', 'expense', 'transfer')",
            name="ck_transactions_type",
        ),
    )
    description: Mapped[str | None] = mapped_column(String(200), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_pending: Mapped[bool] = mapped_column(Boolean, default=False)

    # Primary account (source for transfers)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    # Only used for transfers — the destination account
    transfer_to_account_id: Mapped[int | None] = mapped_column(
        ForeignKey("accounts.id"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Two FKs point to the same table (accounts), so we must specify foreign_keys
    # explicitly — otherwise SQLAlchemy can't figure out which FK each relationship uses
    account: Mapped["Account"] = relationship(
        back_populates="transactions",
        foreign_keys=[account_id],
    )
    transfer_to_account: Mapped["Account | None"] = relationship(
        foreign_keys=[transfer_to_account_id],
    )
    category: Mapped["Category"] = relationship(back_populates="transactions")
