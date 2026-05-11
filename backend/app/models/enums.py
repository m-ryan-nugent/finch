"""Enum types shared across models and schemas.

These inherit from str so they serialize to plain strings in JSON responses
and can be stored directly in SQLAlchemy String columns.
"""

from enum import Enum


class AccountType(str, Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT_CARD = "credit_card"
    INVESTMENT = "investment"
    LOAN = "loan"


class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"


class Frequency(str, Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"


# Groupings for net worth calculations
ASSET_ACCOUNT_TYPES = {AccountType.CHECKING, AccountType.SAVINGS, AccountType.INVESTMENT}
LIABILITY_ACCOUNT_TYPES = {AccountType.CREDIT_CARD, AccountType.LOAN}
