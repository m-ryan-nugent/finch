"""Export endpoints — download transactions as CSV or JSON."""

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services import export_service

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/transactions")
async def export_transactions(
    format: str = Query(default="json", pattern="^(csv|json)$"),
    date_from: date | None = None,
    date_to: date | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Export transactions as CSV or JSON.

    Use ?format=csv for a downloadable CSV file, or ?format=json (default) for JSON.
    """
    if format == "csv":
        return await export_service.export_transactions_csv(db, date_from, date_to)
    return await export_service.export_transactions_json(db, date_from, date_to)
