"""Pydantic schema for the aggregated dashboard response."""

from decimal import Decimal

from pydantic import BaseModel

from app.schemas.account import AccountResponse
from app.schemas.budget import BudgetWithActual
from app.schemas.recurring_item import RecurringItemResponse
from app.schemas.transaction import TransactionResponse, TransactionSummary


class DashboardResponse(BaseModel):
    net_worth: Decimal
    total_assets: Decimal
    total_liabilities: Decimal
    accounts: list[AccountResponse]
    month_summary: TransactionSummary
    budget_vs_actual: list[BudgetWithActual]
    recent_transactions: list[TransactionResponse]
    upcoming_recurring: list[RecurringItemResponse]
