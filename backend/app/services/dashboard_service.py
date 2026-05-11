"""Aggregated dashboard data — assembles data from multiple services."""

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.recurring_item import RecurringItem
from app.models.transaction import Transaction
from app.schemas.dashboard import DashboardResponse
from app.services.account_service import get_accounts
from app.services.budget_service import get_budgets_with_actual
from app.services.transaction_service import get_monthly_summary


async def get_dashboard(db: AsyncSession) -> DashboardResponse:
    """Build the dashboard response by querying each data source.

    We run queries sequentially rather than with asyncio.gather() because
    SQLAlchemy's AsyncSession is NOT safe to share across concurrent tasks.
    Each await here reuses the same session within a single coroutine, which is fine.
    """
    today = date.today()

    # Account balances and net worth
    account_list = await get_accounts(db)

    # Current month income/expense summary
    month_summary = await get_monthly_summary(db, today.month, today.year)

    # Budget vs actual for the current month
    budget_vs_actual = await get_budgets_with_actual(db, today.month, today.year)

    # Last 10 transactions
    result = await db.execute(
        select(Transaction)
        .order_by(Transaction.date.desc(), Transaction.id.desc())
        .limit(10)
    )
    recent_transactions = list(result.scalars().all())

    # Recurring items due in the next 7 days
    next_week = today + timedelta(days=7)
    result = await db.execute(
        select(RecurringItem)
        .where(
            RecurringItem.is_active == True,  # noqa: E712
            RecurringItem.next_due_date <= next_week,
        )
        .order_by(RecurringItem.next_due_date)
    )
    upcoming_recurring = list(result.scalars().all())

    return DashboardResponse(
        net_worth=account_list.net_worth,
        total_assets=account_list.total_assets,
        total_liabilities=account_list.total_liabilities,
        accounts=account_list.accounts,
        month_summary=month_summary,
        budget_vs_actual=budget_vs_actual,
        recent_transactions=recent_transactions,
        upcoming_recurring=upcoming_recurring,
    )
