"""Pydantic schemas for RecurringItem request/response validation."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import Frequency, TransactionType


class RecurringItemBase(BaseModel):
    name: str = Field(max_length=100)
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    frequency: Frequency
    next_due_date: date
    account_id: int
    category_id: int
    type: TransactionType = TransactionType.EXPENSE
    is_active: bool = True
    notes: str | None = None


class RecurringItemCreate(RecurringItemBase):
    pass


class RecurringItemUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    amount: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    frequency: Frequency | None = None
    next_due_date: date | None = None
    account_id: int | None = None
    category_id: int | None = None
    type: TransactionType | None = None
    is_active: bool | None = None
    notes: str | None = None


class RecurringItemResponse(RecurringItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
