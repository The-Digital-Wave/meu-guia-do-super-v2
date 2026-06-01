"""
Seed script: populates the database with realistic Brazilian supermarket data.

Idempotent: uses INSERT ... ON CONFLICT DO NOTHING (PostgreSQL) or
            INSERT OR IGNORE (SQLite) via a dialect-aware helper.

Usage:
    # Against configured DATABASE_URL (PostgreSQL):
    python server/scripts/seed.py

    # SQLite local test (no Supabase needed):
    DATABASE_URL=sqlite+aiosqlite:///./meuguia_seed_test.db python server/scripts/seed.py
"""

from __future__ import annotations

import asyncio
import os
import sys
import uuid
from pathlib import Path

# ── Make src/ importable when invoked from repo root ────────────────────────
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# DATABASE_URL is read from server/.env via pydantic-settings (Settings class below).
# For SQLite local testing, override explicitly:
#   DATABASE_URL=sqlite+aiosqlite:///./test.db python scripts/seed.py

import sqlalchemy as sa  # noqa: E402
from sqlalchemy.dialects.postgresql import insert as pg_insert  # noqa: E402
from sqlalchemy.ext.asyncio import (  # noqa: E402
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.config import settings  # noqa: E402
from src.models import (  # noqa: E402
    Base,
    Edge,
    Layout,
    Node,
    NodeType,
    Product,
    Shelf,
    Supermarket,
)

# ── Seed data ────────────────────────────────────────────────────────────────

SUPERMARKET_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
LAYOUT_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")

# 30 nodes: 2 ENTRY, 2 EXIT, 16 INTERSECTION, 10 SHELF_FRONT
# Grid pattern: rows × cols with normalized coordinates (0.0–1.0)
NODES: list[dict] = [
    # ENTRY nodes (south wall)
    {"id": uuid.UUID("10000000-0000-0000-0000-000000000001"), "x": 0.1, "y": 0.95, "node_type": NodeType.ENTRY, "label": "Entrada Principal"},
    {"id": uuid.UUID("10000000-0000-0000-0000-000000000002"), "x": 0.9, "y": 0.95, "node_type": NodeType.ENTRY, "label": "Entrada Secundária"},
    # EXIT nodes (north wall)
    {"id": uuid.UUID("10000000-0000-0000-0000-000000000003"), "x": 0.1, "y": 0.05, "node_type": NodeType.EXIT, "label": "Saída Principal"},
    {"id": uuid.UUID("10000000-0000-0000-0000-000000000004"), "x": 0.9, "y": 0.05, "node_type": NodeType.EXIT, "label": "Saída Secundária"},
    # INTERSECTION nodes — main aisle grid
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000001"), "x": 0.1, "y": 0.80, "node_type": NodeType.INTERSECTION, "label": "Int-A1"},
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000002"), "x": 0.3, "y": 0.80, "node_type": NodeType.INTERSECTION, "label": "Int-B1"},
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000003"), "x": 0.5, "y": 0.80, "node_type": NodeType.INTERSECTION, "label": "Int-C1"},
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000004"), "x": 0.7, "y": 0.80, "node_type": NodeType.INTERSECTION, "label": "Int-D1"},
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000005"), "x": 0.9, "y": 0.80, "node_type": NodeType.INTERSECTION, "label": "Int-E1"},
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000006"), "x": 0.1, "y": 0.60, "node_type": NodeType.INTERSECTION, "label": "Int-A2"},
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000007"), "x": 0.3, "y": 0.60, "node_type": NodeType.INTERSECTION, "label": "Int-B2"},
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000008"), "x": 0.5, "y": 0.60, "node_type": NodeType.INTERSECTION, "label": "Int-C2"},
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000009"), "x": 0.7, "y": 0.60, "node_type": NodeType.INTERSECTION, "label": "Int-D2"},
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000010"), "x": 0.9, "y": 0.60, "node_type": NodeType.INTERSECTION, "label": "Int-E2"},
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000011"), "x": 0.1, "y": 0.40, "node_type": NodeType.INTERSECTION, "label": "Int-A3"},
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000012"), "x": 0.3, "y": 0.40, "node_type": NodeType.INTERSECTION, "label": "Int-B3"},
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000013"), "x": 0.5, "y": 0.40, "node_type": NodeType.INTERSECTION, "label": "Int-C3"},
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000014"), "x": 0.7, "y": 0.40, "node_type": NodeType.INTERSECTION, "label": "Int-D3"},
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000015"), "x": 0.9, "y": 0.40, "node_type": NodeType.INTERSECTION, "label": "Int-E3"},
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000016"), "x": 0.1, "y": 0.20, "node_type": NodeType.INTERSECTION, "label": "Int-A4"},
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000017"), "x": 0.3, "y": 0.20, "node_type": NodeType.INTERSECTION, "label": "Int-B4"},
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000018"), "x": 0.5, "y": 0.20, "node_type": NodeType.INTERSECTION, "label": "Int-C4"},
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000019"), "x": 0.7, "y": 0.20, "node_type": NodeType.INTERSECTION, "label": "Int-D4"},
    {"id": uuid.UUID("20000000-0000-0000-0000-000000000020"), "x": 0.9, "y": 0.20, "node_type": NodeType.INTERSECTION, "label": "Int-E4"},
    # SHELF_FRONT nodes (positioned between intersections)
    {"id": uuid.UUID("30000000-0000-0000-0000-000000000001"), "x": 0.2, "y": 0.70, "node_type": NodeType.SHELF_FRONT, "label": "SF-Padaria"},
    {"id": uuid.UUID("30000000-0000-0000-0000-000000000002"), "x": 0.4, "y": 0.70, "node_type": NodeType.SHELF_FRONT, "label": "SF-Laticínios"},
    {"id": uuid.UUID("30000000-0000-0000-0000-000000000003"), "x": 0.6, "y": 0.70, "node_type": NodeType.SHELF_FRONT, "label": "SF-Carnes"},
    {"id": uuid.UUID("30000000-0000-0000-0000-000000000004"), "x": 0.8, "y": 0.70, "node_type": NodeType.SHELF_FRONT, "label": "SF-Hortifruti"},
    {"id": uuid.UUID("30000000-0000-0000-0000-000000000005"), "x": 0.2, "y": 0.50, "node_type": NodeType.SHELF_FRONT, "label": "SF-Bebidas"},
    {"id": uuid.UUID("30000000-0000-0000-0000-000000000006"), "x": 0.4, "y": 0.50, "node_type": NodeType.SHELF_FRONT, "label": "SF-Limpeza"},
    {"id": uuid.UUID("30000000-0000-0000-0000-000000000007"), "x": 0.6, "y": 0.50, "node_type": NodeType.SHELF_FRONT, "label": "SF-Higiene"},
    {"id": uuid.UUID("30000000-0000-0000-0000-000000000008"), "x": 0.8, "y": 0.50, "node_type": NodeType.SHELF_FRONT, "label": "SF-Congelados"},
    {"id": uuid.UUID("30000000-0000-0000-0000-000000000009"), "x": 0.2, "y": 0.30, "node_type": NodeType.SHELF_FRONT, "label": "SF-Mercearia"},
    {"id": uuid.UUID("30000000-0000-0000-0000-000000000010"), "x": 0.5, "y": 0.10, "node_type": NodeType.SHELF_FRONT, "label": "SF-Checkout"},
]

# Node ID shorthand helpers
def n(suffix: str) -> uuid.UUID:  # ENTRY/EXIT: 1x (1-4)
    return uuid.UUID(f"1000000{suffix}-0000-0000-0000-000000000000"[:37].ljust(36, "0"))

def i(num: int) -> uuid.UUID:  # INTERSECTION: 2x
    return uuid.UUID(f"20000000-0000-0000-0000-{num:012d}")

def sf(num: int) -> uuid.UUID:  # SHELF_FRONT: 3x
    return uuid.UUID(f"30000000-0000-0000-0000-{num:012d}")


# Resolve UUIDs from node list by label for clarity
NODE_IDS = {node["label"]: node["id"] for node in NODES}

# Build edges: 40 total
# Naming: entry→row1, horizontal rows, vertical columns, shelf-fronts→intersections
EDGES: list[dict] = []

_eid = 0

def edge(from_id: uuid.UUID, to_id: uuid.UUID, dist: float, bidir: bool = True) -> dict:
    global _eid
    _eid += 1
    return {
        "id": uuid.UUID(f"40000000-0000-0000-0000-{_eid:012d}"),
        "node_from_id": from_id,
        "node_to_id": to_id,
        "distance_m": dist,
        "bidirectional": bidir,
    }


# Entry → Row 1 intersections
EDGES += [
    edge(NODE_IDS["Entrada Principal"], NODE_IDS["Int-A1"], 3.0),
    edge(NODE_IDS["Entrada Secundária"], NODE_IDS["Int-E1"], 3.0),
]

# Row 1 horizontal (y=0.80): A1–B1–C1–D1–E1
EDGES += [
    edge(NODE_IDS["Int-A1"], NODE_IDS["Int-B1"], 10.0),
    edge(NODE_IDS["Int-B1"], NODE_IDS["Int-C1"], 10.0),
    edge(NODE_IDS["Int-C1"], NODE_IDS["Int-D1"], 10.0),
    edge(NODE_IDS["Int-D1"], NODE_IDS["Int-E1"], 10.0),
]

# Row 2 horizontal (y=0.60): A2–B2–C2–D2–E2
EDGES += [
    edge(NODE_IDS["Int-A2"], NODE_IDS["Int-B2"], 10.0),
    edge(NODE_IDS["Int-B2"], NODE_IDS["Int-C2"], 10.0),
    edge(NODE_IDS["Int-C2"], NODE_IDS["Int-D2"], 10.0),
    edge(NODE_IDS["Int-D2"], NODE_IDS["Int-E2"], 10.0),
]

# Row 3 horizontal (y=0.40): A3–B3–C3–D3–E3
EDGES += [
    edge(NODE_IDS["Int-A3"], NODE_IDS["Int-B3"], 10.0),
    edge(NODE_IDS["Int-B3"], NODE_IDS["Int-C3"], 10.0),
    edge(NODE_IDS["Int-C3"], NODE_IDS["Int-D3"], 10.0),
    edge(NODE_IDS["Int-D3"], NODE_IDS["Int-E3"], 10.0),
]

# Row 4 horizontal (y=0.20): A4–B4–C4–D4–E4
EDGES += [
    edge(NODE_IDS["Int-A4"], NODE_IDS["Int-B4"], 10.0),
    edge(NODE_IDS["Int-B4"], NODE_IDS["Int-C4"], 10.0),
    edge(NODE_IDS["Int-C4"], NODE_IDS["Int-D4"], 10.0),
    edge(NODE_IDS["Int-D4"], NODE_IDS["Int-E4"], 10.0),
]

# Vertical columns: row1–row2–row3–row4 (A col, C col, E col)
EDGES += [
    edge(NODE_IDS["Int-A1"], NODE_IDS["Int-A2"], 10.0),
    edge(NODE_IDS["Int-A2"], NODE_IDS["Int-A3"], 10.0),
    edge(NODE_IDS["Int-A3"], NODE_IDS["Int-A4"], 10.0),
    edge(NODE_IDS["Int-E1"], NODE_IDS["Int-E2"], 10.0),
    edge(NODE_IDS["Int-E2"], NODE_IDS["Int-E3"], 10.0),
    edge(NODE_IDS["Int-E3"], NODE_IDS["Int-E4"], 10.0),
    edge(NODE_IDS["Int-C1"], NODE_IDS["Int-C2"], 10.0),
    edge(NODE_IDS["Int-C2"], NODE_IDS["Int-C3"], 10.0),
]

# Row4 → EXIT
EDGES += [
    edge(NODE_IDS["Int-A4"], NODE_IDS["Saída Principal"], 4.0),
    edge(NODE_IDS["Int-E4"], NODE_IDS["Saída Secundária"], 4.0),
]

# Shelf front connections (each SHELF_FRONT connects to 2 surrounding intersections)
EDGES += [
    edge(NODE_IDS["SF-Padaria"], NODE_IDS["Int-A1"], 5.0),
    edge(NODE_IDS["SF-Padaria"], NODE_IDS["Int-B1"], 5.0),
    edge(NODE_IDS["SF-Laticínios"], NODE_IDS["Int-B1"], 5.0),
    edge(NODE_IDS["SF-Laticínios"], NODE_IDS["Int-C1"], 5.0),
    edge(NODE_IDS["SF-Carnes"], NODE_IDS["Int-C1"], 5.0),
    edge(NODE_IDS["SF-Carnes"], NODE_IDS["Int-D1"], 5.0),
    edge(NODE_IDS["SF-Hortifruti"], NODE_IDS["Int-D1"], 5.0),
    edge(NODE_IDS["SF-Hortifruti"], NODE_IDS["Int-E1"], 5.0),
    edge(NODE_IDS["SF-Bebidas"], NODE_IDS["Int-A2"], 5.0),
    edge(NODE_IDS["SF-Bebidas"], NODE_IDS["Int-B2"], 5.0),
    edge(NODE_IDS["SF-Limpeza"], NODE_IDS["Int-B2"], 5.0),
    edge(NODE_IDS["SF-Limpeza"], NODE_IDS["Int-C2"], 5.0),
    edge(NODE_IDS["SF-Higiene"], NODE_IDS["Int-C2"], 5.0),
    edge(NODE_IDS["SF-Higiene"], NODE_IDS["Int-D2"], 5.0),
    edge(NODE_IDS["SF-Congelados"], NODE_IDS["Int-D2"], 5.0),
    edge(NODE_IDS["SF-Congelados"], NODE_IDS["Int-E2"], 5.0),
    edge(NODE_IDS["SF-Mercearia"], NODE_IDS["Int-A3"], 5.0),
    edge(NODE_IDS["SF-Mercearia"], NODE_IDS["Int-B3"], 5.0),
    edge(NODE_IDS["SF-Checkout"], NODE_IDS["Int-C4"], 3.0),
    edge(NODE_IDS["SF-Checkout"], NODE_IDS["Saída Principal"], 4.0),
]

# 10 shelves anchored to SHELF_FRONT nodes
SHELVES: list[dict] = [
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000001"), "node_id": NODE_IDS["SF-Padaria"], "aisle": "A", "section": "Padaria", "label": "Pão & Confeitaria", "x": 0.18, "y": 0.68, "width": 0.08, "height": 0.05, "color": "#c8860a"},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000002"), "node_id": NODE_IDS["SF-Laticínios"], "aisle": "B", "section": "Laticínios", "label": "Leite & Derivados", "x": 0.38, "y": 0.68, "width": 0.08, "height": 0.05, "color": "#1f6f5f"},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000003"), "node_id": NODE_IDS["SF-Carnes"], "aisle": "C", "section": "Carnes", "label": "Açougue", "x": 0.58, "y": 0.68, "width": 0.08, "height": 0.05, "color": "#b03030"},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000004"), "node_id": NODE_IDS["SF-Hortifruti"], "aisle": "D", "section": "Hortifruti", "label": "Frutas & Verduras", "x": 0.78, "y": 0.68, "width": 0.08, "height": 0.05, "color": "#2e7d32"},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000005"), "node_id": NODE_IDS["SF-Bebidas"], "aisle": "A", "section": "Bebidas", "label": "Bebidas & Sucos", "x": 0.18, "y": 0.48, "width": 0.08, "height": 0.05, "color": "#1565c0"},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000006"), "node_id": NODE_IDS["SF-Limpeza"], "aisle": "B", "section": "Limpeza", "label": "Produtos de Limpeza", "x": 0.38, "y": 0.48, "width": 0.08, "height": 0.05, "color": "#4a148c"},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000007"), "node_id": NODE_IDS["SF-Higiene"], "aisle": "C", "section": "Higiene", "label": "Higiene Pessoal", "x": 0.58, "y": 0.48, "width": 0.08, "height": 0.05, "color": "#006064"},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000008"), "node_id": NODE_IDS["SF-Congelados"], "aisle": "D", "section": "Congelados", "label": "Congelados", "x": 0.78, "y": 0.48, "width": 0.08, "height": 0.05, "color": "#0d47a1"},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000009"), "node_id": NODE_IDS["SF-Mercearia"], "aisle": "A", "section": "Mercearia", "label": "Mercearia Seca", "x": 0.18, "y": 0.28, "width": 0.08, "height": 0.05, "color": "#e65100"},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000010"), "node_id": NODE_IDS["SF-Checkout"], "aisle": "E", "section": "Checkout", "label": "Caixas", "x": 0.48, "y": 0.08, "width": 0.08, "height": 0.05, "color": "#37474f"},
]

SHELF_IDS = {shelf["section"]: shelf["id"] for shelf in SHELVES}

# 50 products (5 per shelf)
PRODUCTS: list[dict] = [
    # Padaria
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000001"), "shelf_id": SHELF_IDS["Padaria"], "name": "Pão Francês (6 un)", "sku": "PAD-001", "category": "Padaria", "brand": "Casa do Pão", "quantity": 30, "section_index": 1},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000002"), "shelf_id": SHELF_IDS["Padaria"], "name": "Bolo de Cenoura", "sku": "PAD-002", "category": "Confeitaria", "brand": "Amor de Confeitaria", "quantity": 5, "section_index": 2},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000003"), "shelf_id": SHELF_IDS["Padaria"], "name": "Croissant de Manteiga", "sku": "PAD-003", "category": "Padaria", "brand": "Viennoisserie", "quantity": 12, "section_index": 3},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000004"), "shelf_id": SHELF_IDS["Padaria"], "name": "Baguete Tradicional", "sku": "PAD-004", "category": "Padaria", "brand": "Forno de Minas", "quantity": 8, "section_index": 4},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000005"), "shelf_id": SHELF_IDS["Padaria"], "name": "Pão de Queijo (400g)", "sku": "PAD-005", "category": "Padaria", "brand": "Forno de Minas", "quantity": 20, "section_index": 5},
    # Laticínios
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000006"), "shelf_id": SHELF_IDS["Laticínios"], "name": "Leite Integral 1L", "sku": "LAT-001", "category": "Laticínios", "brand": "Itambé", "quantity": 50, "section_index": 1},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000007"), "shelf_id": SHELF_IDS["Laticínios"], "name": "Queijo Minas Frescal 500g", "sku": "LAT-002", "category": "Queijos", "brand": "Tirolez", "quantity": 15, "section_index": 2},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000008"), "shelf_id": SHELF_IDS["Laticínios"], "name": "Iogurte Natural 200g", "sku": "LAT-003", "category": "Laticínios", "brand": "Danone", "quantity": 30, "section_index": 3},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000009"), "shelf_id": SHELF_IDS["Laticínios"], "name": "Manteiga com Sal 200g", "sku": "LAT-004", "category": "Laticínios", "brand": "Aviação", "quantity": 25, "section_index": 4},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000010"), "shelf_id": SHELF_IDS["Laticínios"], "name": "Creme de Leite 200ml", "sku": "LAT-005", "category": "Laticínios", "brand": "Nestlé", "quantity": 40, "section_index": 5},
    # Carnes
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000011"), "shelf_id": SHELF_IDS["Carnes"], "name": "Frango Inteiro Resfriado (kg)", "sku": "CAR-001", "category": "Aves", "brand": "Sadia", "quantity": 10, "section_index": 1},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000012"), "shelf_id": SHELF_IDS["Carnes"], "name": "Alcatra Bovina (kg)", "sku": "CAR-002", "category": "Bovina", "brand": "Friboi", "quantity": 8, "section_index": 2},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000013"), "shelf_id": SHELF_IDS["Carnes"], "name": "Linguiça Toscana 500g", "sku": "CAR-003", "category": "Embutidos", "brand": "Perdigão", "quantity": 20, "section_index": 3},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000014"), "shelf_id": SHELF_IDS["Carnes"], "name": "Peito de Frango sem Osso (kg)", "sku": "CAR-004", "category": "Aves", "brand": "Sadia", "quantity": 12, "section_index": 4},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000015"), "shelf_id": SHELF_IDS["Carnes"], "name": "Costela Bovina (kg)", "sku": "CAR-005", "category": "Bovina", "brand": "Friboi", "quantity": 6, "section_index": 5},
    # Hortifruti
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000016"), "shelf_id": SHELF_IDS["Hortifruti"], "name": "Banana Prata (kg)", "sku": "HOR-001", "category": "Frutas", "brand": None, "quantity": 40, "section_index": 1},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000017"), "shelf_id": SHELF_IDS["Hortifruti"], "name": "Tomate Italiano (kg)", "sku": "HOR-002", "category": "Legumes", "brand": None, "quantity": 25, "section_index": 2},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000018"), "shelf_id": SHELF_IDS["Hortifruti"], "name": "Alface Crespa (un)", "sku": "HOR-003", "category": "Verduras", "brand": None, "quantity": 18, "section_index": 3},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000019"), "shelf_id": SHELF_IDS["Hortifruti"], "name": "Cebola (kg)", "sku": "HOR-004", "category": "Legumes", "brand": None, "quantity": 30, "section_index": 4},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000020"), "shelf_id": SHELF_IDS["Hortifruti"], "name": "Abacate Hass (un)", "sku": "HOR-005", "category": "Frutas", "brand": None, "quantity": 15, "section_index": 5},
    # Bebidas
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000021"), "shelf_id": SHELF_IDS["Bebidas"], "name": "Refrigerante Coca-Cola 2L", "sku": "BEB-001", "category": "Refrigerantes", "brand": "Coca-Cola", "quantity": 35, "section_index": 1},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000022"), "shelf_id": SHELF_IDS["Bebidas"], "name": "Suco de Laranja Integral 1L", "sku": "BEB-002", "category": "Sucos", "brand": "Tropicana", "quantity": 20, "section_index": 2},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000023"), "shelf_id": SHELF_IDS["Bebidas"], "name": "Água Mineral 500ml", "sku": "BEB-003", "category": "Águas", "brand": "Crystal", "quantity": 60, "section_index": 3},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000024"), "shelf_id": SHELF_IDS["Bebidas"], "name": "Cerveja Heineken Lata 350ml", "sku": "BEB-004", "category": "Cervejas", "brand": "Heineken", "quantity": 48, "section_index": 4},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000025"), "shelf_id": SHELF_IDS["Bebidas"], "name": "Chá Verde Gelado 1L", "sku": "BEB-005", "category": "Chás", "brand": "Lipton", "quantity": 15, "section_index": 5},
    # Limpeza
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000026"), "shelf_id": SHELF_IDS["Limpeza"], "name": "Detergente Líquido 500ml", "sku": "LIM-001", "category": "Limpeza", "brand": "Ypê", "quantity": 30, "section_index": 1},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000027"), "shelf_id": SHELF_IDS["Limpeza"], "name": "Amaciante de Roupas 2L", "sku": "LIM-002", "category": "Roupas", "brand": "Comfort", "quantity": 20, "section_index": 2},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000028"), "shelf_id": SHELF_IDS["Limpeza"], "name": "Desinfetante Pinho Sol 1L", "sku": "LIM-003", "category": "Limpeza", "brand": "Pinho Sol", "quantity": 25, "section_index": 3},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000029"), "shelf_id": SHELF_IDS["Limpeza"], "name": "Esponja de Limpeza (3 un)", "sku": "LIM-004", "category": "Utensílios", "brand": "Scotch-Brite", "quantity": 40, "section_index": 4},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000030"), "shelf_id": SHELF_IDS["Limpeza"], "name": "Sabão em Pó 1kg", "sku": "LIM-005", "category": "Roupas", "brand": "OMO", "quantity": 18, "section_index": 5},
    # Higiene
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000031"), "shelf_id": SHELF_IDS["Higiene"], "name": "Shampoo Elseve 400ml", "sku": "HIG-001", "category": "Cabelos", "brand": "L'Oréal", "quantity": 25, "section_index": 1},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000032"), "shelf_id": SHELF_IDS["Higiene"], "name": "Sabonete Dove 90g", "sku": "HIG-002", "category": "Pele", "brand": "Dove", "quantity": 40, "section_index": 2},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000033"), "shelf_id": SHELF_IDS["Higiene"], "name": "Creme Dental Colgate 90g", "sku": "HIG-003", "category": "Dental", "brand": "Colgate", "quantity": 35, "section_index": 3},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000034"), "shelf_id": SHELF_IDS["Higiene"], "name": "Desodorante Rexona 150ml", "sku": "HIG-004", "category": "Desodorante", "brand": "Rexona", "quantity": 30, "section_index": 4},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000035"), "shelf_id": SHELF_IDS["Higiene"], "name": "Papel Higiênico (8 rolos)", "sku": "HIG-005", "category": "Higiene", "brand": "Neve", "quantity": 22, "section_index": 5},
    # Congelados
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000036"), "shelf_id": SHELF_IDS["Congelados"], "name": "Pizza Congelada Mussarela 460g", "sku": "CON-001", "category": "Pizzas", "brand": "Sadia", "quantity": 15, "section_index": 1},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000037"), "shelf_id": SHELF_IDS["Congelados"], "name": "Sorvete Creme 1.5L", "sku": "CON-002", "category": "Sorvetes", "brand": "Nestlé", "quantity": 10, "section_index": 2},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000038"), "shelf_id": SHELF_IDS["Congelados"], "name": "Lasanha Bolonhesa 600g", "sku": "CON-003", "category": "Pratos Prontos", "brand": "Perdigão", "quantity": 12, "section_index": 3},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000039"), "shelf_id": SHELF_IDS["Congelados"], "name": "Ervilha Congelada 300g", "sku": "CON-004", "category": "Legumes", "brand": "Bonduelle", "quantity": 20, "section_index": 4},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000040"), "shelf_id": SHELF_IDS["Congelados"], "name": "Batata Frita Congelada 400g", "sku": "CON-005", "category": "Salgadinhos", "brand": "McCain", "quantity": 18, "section_index": 5},
    # Mercearia
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000041"), "shelf_id": SHELF_IDS["Mercearia"], "name": "Arroz Branco 5kg", "sku": "MER-001", "category": "Grãos", "brand": "Tio João", "quantity": 25, "section_index": 1},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000042"), "shelf_id": SHELF_IDS["Mercearia"], "name": "Feijão Preto 1kg", "sku": "MER-002", "category": "Grãos", "brand": "Camil", "quantity": 30, "section_index": 2},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000043"), "shelf_id": SHELF_IDS["Mercearia"], "name": "Macarrão Espaguete 500g", "sku": "MER-003", "category": "Massas", "brand": "Barilla", "quantity": 40, "section_index": 3},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000044"), "shelf_id": SHELF_IDS["Mercearia"], "name": "Azeite Extravirgem 500ml", "sku": "MER-004", "category": "Óleos", "brand": "Gallo", "quantity": 15, "section_index": 4},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000045"), "shelf_id": SHELF_IDS["Mercearia"], "name": "Molho de Tomate 340g", "sku": "MER-005", "category": "Molhos", "brand": "Heinz", "quantity": 35, "section_index": 5},
    # Checkout (non-food impulse items)
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000046"), "shelf_id": SHELF_IDS["Checkout"], "name": "Chiclete Trident Menta", "sku": "CHK-001", "category": "Balas", "brand": "Trident", "quantity": 50, "section_index": 1},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000047"), "shelf_id": SHELF_IDS["Checkout"], "name": "Chocolate Kinder 20g", "sku": "CHK-002", "category": "Chocolates", "brand": "Ferrero", "quantity": 40, "section_index": 2},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000048"), "shelf_id": SHELF_IDS["Checkout"], "name": "Pilha AA 4 un", "sku": "CHK-003", "category": "Eletrônicos", "brand": "Duracell", "quantity": 20, "section_index": 3},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000049"), "shelf_id": SHELF_IDS["Checkout"], "name": "Água 350ml (gelada)", "sku": "CHK-004", "category": "Águas", "brand": "Crystal", "quantity": 30, "section_index": 4},
    {"id": uuid.UUID("60000000-0000-0000-0000-000000000050"), "shelf_id": SHELF_IDS["Checkout"], "name": "Bolsa Ecológica Reutilizável", "sku": "CHK-005", "category": "Utilidades", "brand": "EcoVerde", "quantity": 25, "section_index": 5},
]


# ── Database helpers ──────────────────────────────────────────────────────────

def is_sqlite(database_url: str) -> bool:
    return database_url.startswith("sqlite")


async def create_tables_if_sqlite(engine: sa.ext.asyncio.AsyncEngine) -> None:
    """For SQLite local testing, create all tables without migrations."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def seed(database_url: str) -> None:
    use_sqlite = is_sqlite(database_url)

    # SQLite needs aiosqlite; replace asyncpg URL if not already sqlite
    engine = create_async_engine(database_url, echo=False)

    if use_sqlite:
        await create_tables_if_sqlite(engine)

    AsyncSession_ = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSession_() as session:
        # ── Supermarket ───────────────────────────────────────────────────────
        if use_sqlite:
            await session.execute(
                sa.insert(Supermarket).values(
                    id=SUPERMARKET_ID,
                    name="Supermercado Bairro Verde",
                    address="Av. Paulista, 1000, São Paulo - SP",
                ).prefix_with("OR IGNORE")
            )
        else:
            await session.execute(
                pg_insert(Supermarket).values(
                    id=SUPERMARKET_ID,
                    name="Supermercado Bairro Verde",
                    address="Av. Paulista, 1000, São Paulo - SP",
                ).on_conflict_do_nothing(index_elements=["id"])
            )

        # ── Layout ────────────────────────────────────────────────────────────
        if use_sqlite:
            await session.execute(
                sa.insert(Layout).values(
                    id=LAYOUT_ID,
                    supermarket_id=SUPERMARKET_ID,
                    name="Planta Principal",
                    width_m=50.0,
                    height_m=30.0,
                ).prefix_with("OR IGNORE")
            )
        else:
            await session.execute(
                pg_insert(Layout).values(
                    id=LAYOUT_ID,
                    supermarket_id=SUPERMARKET_ID,
                    name="Planta Principal",
                    width_m=50.0,
                    height_m=30.0,
                ).on_conflict_do_nothing(index_elements=["id"])
            )

        # ── Nodes ─────────────────────────────────────────────────────────────
        for node_data in NODES:
            row = {**node_data, "layout_id": LAYOUT_ID}
            if use_sqlite:
                stmt = sa.insert(Node).values(**row).prefix_with("OR IGNORE")
            else:
                stmt = pg_insert(Node).values(**row).on_conflict_do_nothing(index_elements=["id"])
            await session.execute(stmt)

        # ── Edges ─────────────────────────────────────────────────────────────
        for edge_data in EDGES:
            row = {**edge_data, "layout_id": LAYOUT_ID}
            if use_sqlite:
                stmt = sa.insert(Edge).values(**row).prefix_with("OR IGNORE")
            else:
                stmt = pg_insert(Edge).values(**row).on_conflict_do_nothing(index_elements=["id"])
            await session.execute(stmt)

        # ── Shelves ───────────────────────────────────────────────────────────
        for shelf_data in SHELVES:
            row = {**shelf_data, "layout_id": LAYOUT_ID}
            if use_sqlite:
                stmt = sa.insert(Shelf).values(**row).prefix_with("OR IGNORE")
            else:
                stmt = pg_insert(Shelf).values(**row).on_conflict_do_nothing(index_elements=["id"])
            await session.execute(stmt)

        # ── Products ──────────────────────────────────────────────────────────
        for product_data in PRODUCTS:
            if use_sqlite:
                stmt = sa.insert(Product).values(**product_data).prefix_with("OR IGNORE")
            else:
                stmt = pg_insert(Product).values(**product_data).on_conflict_do_nothing(index_elements=["id"])
            await session.execute(stmt)

        await session.commit()

    await engine.dispose()
    print("Seed completed successfully.")
    print(f"  Supermarket: 1  |  Layout: 1  |  Nodes: {len(NODES)}")
    print(f"  Edges: {len(EDGES)}  |  Shelves: {len(SHELVES)}  |  Products: {len(PRODUCTS)}")


if __name__ == "__main__":
    db_url = os.environ.get("DATABASE_URL") or settings.DATABASE_URL
    asyncio.run(seed(db_url))
