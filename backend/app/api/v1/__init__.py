"""Aggregate all v1 route modules into a single router."""

from fastapi import APIRouter

from app.api.v1.routes import (
    accounts,
    budgets,
    categories,
    dashboard,
    export,
    health,
    recurring_items,
    transactions,
)

api_v1_router = APIRouter()

api_v1_router.include_router(health.router)
api_v1_router.include_router(accounts.router)
api_v1_router.include_router(categories.router)
api_v1_router.include_router(transactions.router)
api_v1_router.include_router(recurring_items.router)
api_v1_router.include_router(budgets.router)
api_v1_router.include_router(export.router)
api_v1_router.include_router(dashboard.router)
