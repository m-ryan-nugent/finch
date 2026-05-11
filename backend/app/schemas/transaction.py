"""Pydantic schemas for Transaction request/response validation."""

# Type aliases avoid a name collision: the field name "date" would shadow
# the datetime.date type during Pydantic's annotation evaluation
import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import TransactionType


class TransactionBase(BaseModel):
    date: datetime.date
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    type: TransactionType
    account_id: int
    category_id: int
    description: Optional[str] = Field(default=None, max_length=200)
    notes: Optional[str] = None
    is_pending: bool = False


class TransactionCreate(TransactionBase):
    transfer_to_account_id: Optional[int] = None

    @model_validator(mode="after")
    def validate_transfer_fields(self):
        """Transfers must specify a destination; non-transfers must not."""
        if self.type == TransactionType.TRANSFER:
            if self.transfer_to_account_id is None:
                raise ValueError("transfer_to_account_id is required for transfers")
            if self.transfer_to_account_id == self.account_id:
                raise ValueError("Cannot transfer to the same account")
        else:
            if self.transfer_to_account_id is not None:
                raise ValueError("transfer_to_account_id should only be set for transfers")
        return self


class TransactionUpdate(BaseModel):
    """All fields optional for PATCH semantics."""

    date: Optional[datetime.date] = None
    amount: Optional[Decimal] = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    type: Optional[TransactionType] = None
    account_id: Optional[int] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    is_pending: Optional[bool] = None
    transfer_to_account_id: Optional[int] = None


class TransactionResponse(TransactionBase):
    id: int
    transfer_to_account_id: Optional[int]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionFilter(BaseModel):
    """Query parameters for filtering the transaction list."""

    account_id: Optional[int] = None
    category_id: Optional[int] = None
    type: Optional[TransactionType] = None
    date_from: Optional[datetime.date] = None
    date_to: Optional[datetime.date] = None
    is_pending: Optional[bool] = None


class TransactionSummary(BaseModel):
    """Monthly totals for income, expenses, and net."""

    month: int
    year: int
    total_income: Decimal
    total_expenses: Decimal
    net: Decimal
