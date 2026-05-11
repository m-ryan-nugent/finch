"""Pydantic schemas for Budget request/response validation."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class BudgetBase(BaseModel):
    category_id: int
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2000)
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)


class BudgetResponse(BudgetBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BudgetWithActual(BudgetResponse):
    """Budget with actual spending — used in budget-vs-actual reports."""

    actual_spent: Decimal
    remaining: Decimal
