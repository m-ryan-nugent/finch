"""Account model — represents a financial account (bank, credit card, etc.)."""

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import AccountType

if TYPE_CHECKING:
    from app.models.transaction import Transaction


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    # Store enum as string rather than native PG enum — easier to migrate
    type: Mapped[str] = mapped_column(
        String(50),
        CheckConstraint(
            "type IN ('checking', 'savings', 'credit_card', 'investment', 'loan')",
            name="ck_accounts_type",
        ),
    )
    balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    institution: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # server_default uses the database's NOW() so timestamps are consistent
    # even if the Python process clock drifts
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Transactions where this account is the primary (source) account
    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="account",
        foreign_keys="Transaction.account_id",
    )

    @property
    def is_asset(self) -> bool:
        return AccountType(self.type) in {
            AccountType.CHECKING,
            AccountType.SAVINGS,
            AccountType.INVESTMENT,
        }

    @property
    def is_liability(self) -> bool:
        return AccountType(self.type) in {
            AccountType.CREDIT_CARD,
            AccountType.LOAN,
        }
