"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-27 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── Enums ─────────────────────────────────────────────────────────────────
    node_type_enum = postgresql.ENUM(
        "INTERSECTION", "SHELF_FRONT", "ENTRY", "EXIT",
        name="node_type_enum",
        create_type=False,
    )
    node_type_enum.create(op.get_bind(), checkfirst=True)

    user_role_enum = postgresql.ENUM(
        "CUSTOMER", "ADMIN",
        name="user_role_enum",
        create_type=False,
    )
    user_role_enum.create(op.get_bind(), checkfirst=True)

    # ── supermarkets ──────────────────────────────────────────────────────────
    op.create_table(
        "supermarkets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── layouts ───────────────────────────────────────────────────────────────
    op.create_table(
        "layouts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "supermarket_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("supermarkets.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("width_m", sa.Float(), nullable=False),
        sa.Column("height_m", sa.Float(), nullable=False),
        sa.Column("image_url", sa.String(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_layouts_supermarket_id", "layouts", ["supermarket_id"])

    # ── nodes ─────────────────────────────────────────────────────────────────
    op.create_table(
        "nodes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "layout_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("layouts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("x", sa.Float(), nullable=False),
        sa.Column("y", sa.Float(), nullable=False),
        sa.Column(
            "node_type",
            postgresql.ENUM(
                "INTERSECTION", "SHELF_FRONT", "ENTRY", "EXIT",
                name="node_type_enum",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("label", sa.String(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_nodes_layout_id", "nodes", ["layout_id"])

    # ── edges ─────────────────────────────────────────────────────────────────
    op.create_table(
        "edges",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "layout_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("layouts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "node_from_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("nodes.id"),
            nullable=False,
        ),
        sa.Column(
            "node_to_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("nodes.id"),
            nullable=False,
        ),
        sa.Column("distance_m", sa.Float(), nullable=False),
        sa.Column("bidirectional", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_edges_layout_id", "edges", ["layout_id"])
    op.create_index("ix_edges_node_from_id", "edges", ["node_from_id"])
    op.create_index("ix_edges_node_to_id", "edges", ["node_to_id"])

    # ── shelves ───────────────────────────────────────────────────────────────
    op.create_table(
        "shelves",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "layout_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("layouts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "node_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("nodes.id"),
            nullable=True,
        ),
        sa.Column("aisle", sa.String(), nullable=False),
        sa.Column("section", sa.String(), nullable=False),
        sa.Column("label", sa.String(), nullable=True),
        sa.Column("x", sa.Float(), nullable=True),
        sa.Column("y", sa.Float(), nullable=True),
        sa.Column("width", sa.Float(), nullable=True),
        sa.Column("height", sa.Float(), nullable=True),
        sa.Column("color", sa.String(), nullable=False, server_default="#1f6f5f"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_shelves_layout_id", "shelves", ["layout_id"])
    op.create_index("ix_shelves_node_id", "shelves", ["node_id"])

    # ── products ──────────────────────────────────────────────────────────────
    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "shelf_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("shelves.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("sku", sa.String(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("brand", sa.String(), nullable=True),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("image_url", sa.String(), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("section_index", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_products_shelf_id", "products", ["shelf_id"])
    op.create_unique_constraint("uq_products_sku", "products", ["sku"])

    # ── users ─────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column(
            "role",
            postgresql.ENUM(
                "CUSTOMER", "ADMIN",
                name="user_role_enum",
                create_type=False,
            ),
            nullable=False,
            server_default="CUSTOMER",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_unique_constraint("uq_users_email", "users", ["email"])
    op.create_index("ix_users_email", "users", ["email"])

    # ── grocery_lists ─────────────────────────────────────────────────────────
    op.create_table(
        "grocery_lists",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "layout_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("layouts.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("name", sa.String(), nullable=False, server_default="Minha Lista"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_grocery_lists_user_id", "grocery_lists", ["user_id"])
    op.create_index("ix_grocery_lists_layout_id", "grocery_lists", ["layout_id"])

    # ── grocery_list_items ────────────────────────────────────────────────────
    op.create_table(
        "grocery_list_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "list_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("grocery_lists.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "product_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("products.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("product_name_snapshot", sa.String(), nullable=False),
        sa.Column("checked", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_grocery_list_items_list_id", "grocery_list_items", ["list_id"])
    op.create_index("ix_grocery_list_items_product_id", "grocery_list_items", ["product_id"])


def downgrade() -> None:
    op.drop_table("grocery_list_items")
    op.drop_table("grocery_lists")
    op.drop_table("users")
    op.drop_table("products")
    op.drop_table("shelves")
    op.drop_table("edges")
    op.drop_table("nodes")
    op.drop_table("layouts")
    op.drop_table("supermarkets")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS node_type_enum")
    op.execute("DROP TYPE IF EXISTS user_role_enum")
