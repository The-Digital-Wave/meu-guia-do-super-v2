"""Re-export all SQLAlchemy models so Alembic can detect them for autogenerate."""

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from src.models.edge import Edge
from src.models.grocery_list import GroceryList, GroceryListItem
from src.models.layout import Layout
from src.models.node import Node, NodeType
from src.models.product import Product
from src.models.shelf import Shelf
from src.models.supermarket import Supermarket
from src.models.user import User, UserRole

__all__ = [
    "Base",
    "TimestampMixin",
    "UUIDPrimaryKeyMixin",
    "Supermarket",
    "Layout",
    "Node",
    "NodeType",
    "Edge",
    "Shelf",
    "Product",
    "User",
    "UserRole",
    "GroceryList",
    "GroceryListItem",
]
