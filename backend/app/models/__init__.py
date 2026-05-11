"""Re-export all models so Alembic can discover them via a single import.

Alembic's autogenerate reads Base.metadata to detect tables. Models only
register with Base.metadata when their module is imported, so this file
ensures every model is imported when you do `from app.models import ...`.
"""

from app.models.account import Account
from app.models.budget import Budget
from app.models.category import Category
from app.models.enums import (
    ASSET_ACCOUNT_TYPES,
    LIABILITY_ACCOUNT_TYPES,
    AccountType,
    Frequency,
    TransactionType,
)
from app.models.recurring_item import RecurringItem
from app.models.transaction import Transaction

__all__ = [
    "Account",
    "Budget",
    "Category",
    "RecurringItem",
    "Transaction",
    "AccountType",
    "TransactionType",
    "Frequency",
    "ASSET_ACCOUNT_TYPES",
    "LIABILITY_ACCOUNT_TYPES",
]
