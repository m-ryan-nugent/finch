"""Category model — groups transactions (e.g., Housing, Food & Dining)."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.budget import Budget
    from app.models.transaction import Transaction


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)
    # Default categories ship with the app and cannot be deleted
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    # Optional hex color for UI display (e.g., "#FF5733")
    color: Mapped[str | None] = mapped_column(String(7), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    transactions: Mapped[list["Transaction"]] = relationship(back_populates="category")
    budgets: Mapped[list["Budget"]] = relationship(back_populates="category")


# Seed data for first-run initialization — each gets is_default=True
DEFAULT_CATEGORIES = [
    {"name": "Housing", "color": "#4CAF50"},
    {"name": "Food & Dining", "color": "#FF9800"},
    {"name": "Transportation", "color": "#2196F3"},
    {"name": "Utilities", "color": "#9C27B0"},
    {"name": "Healthcare", "color": "#F44336"},
    {"name": "Entertainment", "color": "#E91E63"},
    {"name": "Shopping", "color": "#00BCD4"},
    {"name": "Personal Care", "color": "#795548"},
    {"name": "Travel", "color": "#FF5722"},
    {"name": "Education", "color": "#3F51B5"},
    {"name": "Income", "color": "#8BC34A"},
    {"name": "Transfer", "color": "#607D8B"},
    {"name": "Other", "color": "#9E9E9E"},
]
