"""add enum check constraints

Revision ID: a1f7c3e2b9d4
Revises: 4b8c63300361
Create Date: 2026-05-13 18:35:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "a1f7c3e2b9d4"
down_revision: Union[str, Sequence[str], None] = "4b8c63300361"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_check_constraint(
        "ck_accounts_type",
        "accounts",
        "type IN ('checking', 'savings', 'credit_card', 'investment', 'loan')",
    )
    op.create_check_constraint(
        "ck_transactions_type",
        "transactions",
        "type IN ('income', 'expense', 'transfer')",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("ck_transactions_type", "transactions", type_="check")
    op.drop_constraint("ck_accounts_type", "accounts", type_="check")
