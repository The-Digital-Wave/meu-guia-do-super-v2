"""add slug, logo_url, is_active to supermarkets

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-03 00:00:00.000000
"""
from collections.abc import Sequence
import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("supermarkets", sa.Column("slug", sa.String(), nullable=False, server_default=""))
    op.add_column("supermarkets", sa.Column("logo_url", sa.String(), nullable=True))
    op.add_column("supermarkets", sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"))
    op.create_unique_constraint("uq_supermarkets_slug", "supermarkets", ["slug"])
    op.create_index("ix_supermarkets_slug", "supermarkets", ["slug"])


def downgrade() -> None:
    op.drop_index("ix_supermarkets_slug", table_name="supermarkets")
    op.drop_constraint("uq_supermarkets_slug", "supermarkets", type_="unique")
    op.drop_column("supermarkets", "is_active")
    op.drop_column("supermarkets", "logo_url")
    op.drop_column("supermarkets", "slug")
