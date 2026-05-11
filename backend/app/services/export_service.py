"""Export transactions as CSV or JSON."""

import csv
import io
from datetime import date

from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction


async def export_transactions_csv(
    db: AsyncSession,
    date_from: date | None = None,
    date_to: date | None = None,
) -> StreamingResponse:
    """Generate a CSV file of transactions, optionally filtered by date range."""
    transactions = await _get_filtered_transactions(db, date_from, date_to)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "date", "amount", "type", "account_id", "category_id",
                      "description", "notes", "is_pending", "transfer_to_account_id"])

    for t in transactions:
        writer.writerow([
            t.id, t.date, t.amount, t.type, t.account_id, t.category_id,
            t.description, t.notes, t.is_pending, t.transfer_to_account_id,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )


async def export_transactions_json(
    db: AsyncSession,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[dict]:
    """Return transactions as a list of dicts for JSON response."""
    transactions = await _get_filtered_transactions(db, date_from, date_to)
    return [
        {
            "id": t.id,
            "date": t.date.isoformat(),
            "amount": str(t.amount),
            "type": t.type,
            "account_id": t.account_id,
            "category_id": t.category_id,
            "description": t.description,
            "notes": t.notes,
            "is_pending": t.is_pending,
            "transfer_to_account_id": t.transfer_to_account_id,
        }
        for t in transactions
    ]


async def _get_filtered_transactions(
    db: AsyncSession,
    date_from: date | None,
    date_to: date | None,
) -> list[Transaction]:
    """Shared query logic for export endpoints."""
    query = select(Transaction).order_by(Transaction.date.desc())

    if date_from is not None:
        query = query.where(Transaction.date >= date_from)
    if date_to is not None:
        query = query.where(Transaction.date <= date_to)

    result = await db.execute(query)
    return list(result.scalars().all())
