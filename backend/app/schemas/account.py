"""Pydantic schemas for Account request/response validation.

Schema pattern used throughout the app:
  - Base: shared fields between create and response
  - Create(Base): fields needed when creating a new record
  - Update: all fields optional for PATCH semantics
  - Response(Base): adds DB-generated fields (id, timestamps)
"""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AccountType


class AccountBase(BaseModel):
    name: str = Field(max_length=100)
    type: AccountType
    institution: str | None = Field(default=None, max_length=100)
    notes: str | None = None


class AccountCreate(AccountBase):
    balance: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2)


class AccountUpdate(BaseModel):
    """All fields optional — only fields included in the request get updated."""

    name: str | None = Field(default=None, max_length=100)
    type: AccountType | None = None
    institution: str | None = None
    notes: str | None = None
    balance: Decimal | None = Field(default=None, max_digits=12, decimal_places=2)


class AccountResponse(AccountBase):
    id: int
    balance: Decimal
    created_at: datetime
    updated_at: datetime

    # from_attributes=True lets Pydantic read data directly from SQLAlchemy model
    # attributes (e.g., account.name) instead of requiring a dict
    model_config = ConfigDict(from_attributes=True)


class AccountListResponse(BaseModel):
    accounts: list[AccountResponse]
    total_assets: Decimal
    total_liabilities: Decimal
    net_worth: Decimal
