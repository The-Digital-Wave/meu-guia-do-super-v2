# Phase 8a — Supermarket Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `slug`, `logo_url`, `is_active` fields to the existing `Supermarket` model, then wire up the full `GET /supermarkets` and `GET /supermarkets/:id` API surface with repository → service → controller → router layers, update the seed script to use generic store names, and add integration tests.

**Architecture:** Controller-Service-Repository pattern matching all existing routes. A new Alembic migration adds the three missing columns to the `supermarkets` table. The router is registered in `main.py` alongside existing routers.

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy 2.0 async, Pydantic v2, Alembic, pytest + httpx (aiosqlite in-memory for tests)

**Branch:** `feature/phase-8a-supermarket-model` (cut from `master`)

---

## File Map

| Action | Path |
|--------|------|
| Modify | `server/src/models/supermarket.py` |
| Create | `server/alembic/versions/0002_supermarket_fields.py` |
| Create | `server/src/schemas/supermarket.py` |
| Create | `server/src/repositories/supermarket_repository.py` |
| Create | `server/src/services/supermarket_service.py` |
| Create | `server/src/controllers/supermarket.py` |
| Create | `server/src/routers/supermarkets.py` |
| Modify | `server/src/main.py` |
| Modify | `server/scripts/seed.py` |
| Modify | `server/api-spec.md` |
| Create | `server/tests/test_supermarkets.py` |

---

## Task 1: Update `api-spec.md` with supermarket endpoints

**Files:**
- Modify: `server/api-spec.md`

- [ ] **Step 1: Add supermarket section to api-spec.md**

Open `server/api-spec.md` and append the following section after the existing Layouts section:

```markdown
## 4. Supermarkets

Active store locations available for indoor navigation.

- **GET /supermarkets** → Returns a list of active supermarkets.

  Response body (`200 OK`):
  ```json
  [
    {
      "id": "uuid",
      "name": "Supermercado A",
      "slug": "supermercado-a",
      "logo_url": null,
      "is_active": true,
      "created_at": "ISO8601"
    }
  ]
  ```

- **GET /supermarkets/:id** → Returns a single supermarket with its layouts.

  Response body (`200 OK`):
  ```json
  {
    "id": "uuid",
    "name": "Supermercado A",
    "slug": "supermercado-a",
    "logo_url": null,
    "is_active": true,
    "created_at": "ISO8601",
    "layouts": [ /* LayoutOut[] */ ]
  }
  ```

  Also add `supermarket_id` as an optional filter to `GET /layouts`:

  | Parameter | Type | Required | Default | Description |
  |---|---|---|---|---|
  | `supermarket_id` | uuid | no | — | Filter layouts by supermarket |
```

- [ ] **Step 2: Commit**

```bash
git add server/api-spec.md
git commit -m "docs(api-spec): add supermarkets endpoints and layouts supermarket_id filter"
```

---

## Task 2: Update the Supermarket SQLAlchemy model

**Files:**
- Modify: `server/src/models/supermarket.py`

- [ ] **Step 1: Write the updated model**

Replace the entire contents of `server/src/models/supermarket.py`:

```python
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from src.models.layout import Layout


class Supermarket(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "supermarkets"

    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    logo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    layouts: Mapped[list["Layout"]] = relationship(
        "Layout",
        back_populates="supermarket",
        cascade="all, delete-orphan",
    )
```

- [ ] **Step 2: Commit**

```bash
git add server/src/models/supermarket.py
git commit -m "feat(model): add slug, logo_url, is_active to Supermarket"
```

---

## Task 3: Create Alembic migration for new columns

**Files:**
- Create: `server/alembic/versions/0002_supermarket_fields.py`

- [ ] **Step 1: Create the migration file**

Create `server/alembic/versions/0002_supermarket_fields.py` with this exact content:

```python
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
    op.add_column(
        "supermarkets",
        sa.Column("slug", sa.String(), nullable=False, server_default=""),
    )
    op.add_column(
        "supermarkets",
        sa.Column("logo_url", sa.String(), nullable=True),
    )
    op.add_column(
        "supermarkets",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.create_unique_constraint("uq_supermarkets_slug", "supermarkets", ["slug"])
    op.create_index("ix_supermarkets_slug", "supermarkets", ["slug"])


def downgrade() -> None:
    op.drop_index("ix_supermarkets_slug", table_name="supermarkets")
    op.drop_constraint("uq_supermarkets_slug", "supermarkets", type_="unique")
    op.drop_column("supermarkets", "is_active")
    op.drop_column("supermarkets", "logo_url")
    op.drop_column("supermarkets", "slug")
```

- [ ] **Step 2: Commit**

```bash
git add server/alembic/versions/0002_supermarket_fields.py
git commit -m "feat(migration): add slug, logo_url, is_active to supermarkets table"
```

---

## Task 4: Create Pydantic schemas

**Files:**
- Create: `server/src/schemas/supermarket.py`

- [ ] **Step 1: Write the failing test first**

Add to `server/tests/test_supermarkets.py` (create the file):

```python
"""Integration tests for GET /supermarkets endpoints."""
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.supermarket import Supermarket


async def _create_supermarket(
    db: AsyncSession,
    name: str = "Supermercado A",
    slug: str = "supermercado-a",
    is_active: bool = True,
) -> Supermarket:
    sm = Supermarket(name=name, slug=slug, is_active=is_active)
    db.add(sm)
    await db.flush()
    await db.refresh(sm)
    return sm


@pytest.mark.asyncio
async def test_list_supermarkets_empty(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/supermarkets")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_list_supermarkets_returns_only_active(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    await _create_supermarket(db_session, "Supermercado A", "supermercado-a", is_active=True)
    await _create_supermarket(db_session, "Supermercado B", "supermercado-b", is_active=False)
    await db_session.commit()

    resp = await client.get("/api/v1/supermarkets")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["slug"] == "supermercado-a"
    assert "slug" in data[0]
    assert "logo_url" in data[0]
    assert "is_active" in data[0]


@pytest.mark.asyncio
async def test_get_supermarket_by_id(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    sm = await _create_supermarket(db_session)
    await db_session.commit()

    resp = await client.get(f"/api/v1/supermarkets/{sm.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == str(sm.id)
    assert data["slug"] == "supermercado-a"
    assert "layouts" in data


@pytest.mark.asyncio
async def test_get_supermarket_not_found(client: AsyncClient) -> None:
    resp = await client.get(f"/api/v1/supermarkets/{uuid.uuid4()}")
    assert resp.status_code == 404
```

- [ ] **Step 2: Run tests — expect ImportError (schemas not yet created)**

```bash
cd server && python -m pytest tests/test_supermarkets.py -v
```

Expected output: `ImportError` or `ModuleNotFoundError` because `supermarkets` router doesn't exist yet.

- [ ] **Step 3: Create the schemas**

Create `server/src/schemas/supermarket.py`:

```python
"""Supermarket Pydantic v2 schemas."""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from src.schemas.layout import LayoutOut


class SupermarketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    logo_url: str | None
    address: str | None
    is_active: bool
    created_at: datetime


class SupermarketDetailOut(SupermarketOut):
    layouts: list[LayoutOut] = []
```

- [ ] **Step 4: Commit**

```bash
git add server/src/schemas/supermarket.py server/tests/test_supermarkets.py
git commit -m "feat(schemas): add SupermarketOut and SupermarketDetailOut"
```

---

## Task 5: Create the Supermarket repository

**Files:**
- Create: `server/src/repositories/supermarket_repository.py`

- [ ] **Step 1: Write the repository**

Create `server/src/repositories/supermarket_repository.py`:

```python
"""Supermarket repository — SQLAlchemy async data access only. No business logic here."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.supermarket import Supermarket


async def get_all_active(db: AsyncSession) -> list[Supermarket]:
    """Return all supermarkets where is_active is True."""
    result = await db.execute(
        select(Supermarket).where(Supermarket.is_active == True).order_by(Supermarket.name)  # noqa: E712
    )
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, supermarket_id: uuid.UUID) -> Supermarket | None:
    """Return the Supermarket with its layouts eagerly loaded, or None."""
    result = await db.execute(
        select(Supermarket)
        .options(selectinload(Supermarket.layouts))
        .where(Supermarket.id == supermarket_id)
    )
    return result.scalar_one_or_none()
```

- [ ] **Step 2: Commit**

```bash
git add server/src/repositories/supermarket_repository.py
git commit -m "feat(repository): add supermarket_repository"
```

---

## Task 6: Create the Supermarket service

**Files:**
- Create: `server/src/services/supermarket_service.py`

- [ ] **Step 1: Write the service**

Create `server/src/services/supermarket_service.py`:

```python
"""Supermarket service — business logic only. No direct DB queries; calls repository."""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.models.supermarket import Supermarket
from src.repositories import supermarket_repository


async def list_active_supermarkets(db: AsyncSession) -> list[Supermarket]:
    """Return all active supermarkets ordered by name."""
    return await supermarket_repository.get_all_active(db)


async def get_supermarket(db: AsyncSession, supermarket_id: uuid.UUID) -> Supermarket:
    """Return the supermarket with its layouts.

    Raises ValueError if not found.
    """
    supermarket = await supermarket_repository.get_by_id(db, supermarket_id)
    if supermarket is None:
        raise ValueError(f"Supermarket {supermarket_id} not found")
    return supermarket
```

- [ ] **Step 2: Commit**

```bash
git add server/src/services/supermarket_service.py
git commit -m "feat(service): add supermarket_service"
```

---

## Task 7: Create the Supermarket controller

**Files:**
- Create: `server/src/controllers/supermarket.py`

- [ ] **Step 1: Write the controller**

Create `server/src/controllers/supermarket.py`:

```python
"""Supermarket controller — validates input, delegates to service, maps errors to HTTP."""
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.supermarket import Supermarket
from src.services import supermarket_service


async def list_supermarkets(db: AsyncSession) -> list[Supermarket]:
    return await supermarket_service.list_active_supermarkets(db)


async def get_supermarket(db: AsyncSession, supermarket_id: uuid.UUID) -> Supermarket:
    try:
        return await supermarket_service.get_supermarket(db, supermarket_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
```

- [ ] **Step 2: Commit**

```bash
git add server/src/controllers/supermarket.py
git commit -m "feat(controller): add supermarket controller"
```

---

## Task 8: Create the Supermarket router and register it

**Files:**
- Create: `server/src/routers/supermarkets.py`
- Modify: `server/src/main.py`

- [ ] **Step 1: Write the router**

Create `server/src/routers/supermarkets.py`:

```python
"""Supermarkets router — public read-only endpoints."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers import supermarket as supermarket_controller
from src.database import get_db
from src.schemas.supermarket import SupermarketDetailOut, SupermarketOut

router = APIRouter(prefix="/supermarkets", tags=["supermarkets"])


@router.get("", response_model=list[SupermarketOut], status_code=status.HTTP_200_OK)
async def list_supermarkets(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[SupermarketOut]:
    """List all active supermarkets."""
    supermarkets = await supermarket_controller.list_supermarkets(db)
    return [SupermarketOut.model_validate(sm) for sm in supermarkets]


@router.get(
    "/{supermarket_id}",
    response_model=SupermarketDetailOut,
    status_code=status.HTTP_200_OK,
)
async def get_supermarket(
    supermarket_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SupermarketDetailOut:
    """Get a supermarket with its layouts."""
    supermarket = await supermarket_controller.get_supermarket(db, supermarket_id)
    return SupermarketDetailOut.model_validate(supermarket)
```

- [ ] **Step 2: Register in `main.py`**

Open `server/src/main.py`. Find the imports block and add:

```python
from src.routers import (
    auth,
    edges,
    grocery_lists,
    layouts,
    navigation,
    nodes,
    products,
    shelves,
    supermarkets,   # ← add this line
    users,
)
```

Then find the `app.include_router` block and add:

```python
app.include_router(supermarkets.router, prefix=_API_PREFIX)
```

alongside the other routers (alphabetical order is fine).

- [ ] **Step 3: Run the failing tests — expect them to pass now**

```bash
cd server && python -m pytest tests/test_supermarkets.py -v
```

Expected output:
```
tests/test_supermarkets.py::test_list_supermarkets_empty PASSED
tests/test_supermarkets.py::test_list_supermarkets_returns_only_active PASSED
tests/test_supermarkets.py::test_get_supermarket_by_id PASSED
tests/test_supermarkets.py::test_get_supermarket_not_found PASSED

4 passed in ...
```

- [ ] **Step 4: Run full test suite**

```bash
cd server && python -m pytest tests/ -v
```

Expected: all existing tests still pass.

- [ ] **Step 5: Commit**

```bash
git add server/src/routers/supermarkets.py server/src/main.py
git commit -m "feat(router): add supermarkets router and register in main"
```

---

## Task 9: Add `supermarket_id` filter to `GET /layouts`

**Files:**
- Modify: `server/src/routers/layouts.py`
- Modify: `server/src/controllers/layout.py`
- Modify: `server/src/services/layout_service.py`

- [ ] **Step 1: Write failing test for the filter**

Add to `server/tests/test_supermarkets.py`:

```python
@pytest.mark.asyncio
async def test_list_layouts_filtered_by_supermarket(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    from src.models.layout import Layout

    sm_a = await _create_supermarket(db_session, "Supermercado A", "supermercado-a")
    sm_b = await _create_supermarket(db_session, "Supermercado B", "supermercado-b")
    layout_a = Layout(
        supermarket_id=sm_a.id,
        name="Layout A",
        width_m=50.0,
        height_m=30.0,
    )
    layout_b = Layout(
        supermarket_id=sm_b.id,
        name="Layout B",
        width_m=40.0,
        height_m=20.0,
    )
    db_session.add_all([layout_a, layout_b])
    await db_session.commit()

    resp = await client.get(f"/api/v1/layouts?supermarket_id={sm_a.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "Layout A"
```

- [ ] **Step 2: Run — expect FAIL (filter not yet implemented)**

```bash
cd server && python -m pytest tests/test_supermarkets.py::test_list_layouts_filtered_by_supermarket -v
```

Expected: `AssertionError` — returns 2 layouts instead of 1.

- [ ] **Step 3: Add optional `supermarket_id` query param to layout service**

In `server/src/services/layout_service.py`, update `list_layouts`:

```python
async def list_layouts(
    db: AsyncSession,
    supermarket_id: uuid.UUID | None = None,
) -> list[Layout]:
    """Return all layouts, optionally filtered by supermarket_id."""
    if supermarket_id is not None:
        return await layout_repository.get_by_supermarket(db, supermarket_id)
    return await layout_repository.get_all(db)
```

- [ ] **Step 4: Update layout controller to pass the filter**

In `server/src/controllers/layout.py`, update `list_layouts`:

```python
async def list_layouts(
    db: AsyncSession,
    supermarket_id: uuid.UUID | None = None,
) -> list[Layout]:
    return await layout_service.list_layouts(db, supermarket_id=supermarket_id)
```

- [ ] **Step 5: Update the router to accept the query param**

In `server/src/routers/layouts.py`, update the `list_layouts` endpoint:

```python
@router.get("", response_model=list[LayoutOut], status_code=status.HTTP_200_OK)
async def list_layouts(
    db: Annotated[AsyncSession, Depends(get_db)],
    supermarket_id: uuid.UUID | None = None,
) -> list[LayoutOut]:
    """List all layouts, optionally filtered by supermarket_id."""
    layouts = await layout_controller.list_layouts(db, supermarket_id=supermarket_id)
    return [LayoutOut.model_validate(layout) for layout in layouts]
```

- [ ] **Step 6: Run failing test — expect PASS**

```bash
cd server && python -m pytest tests/test_supermarkets.py -v
```

Expected: all 5 tests pass.

- [ ] **Step 7: Run full test suite**

```bash
cd server && python -m pytest tests/ -v
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add server/src/routers/layouts.py server/src/controllers/layout.py server/src/services/layout_service.py
git commit -m "feat(layouts): add optional supermarket_id filter to GET /layouts"
```

---

## Task 10: Update seed script with generic store names

**Files:**
- Modify: `server/scripts/seed.py`

- [ ] **Step 1: Update SUPERMARKET_ID and seed data**

In `server/scripts/seed.py`, find and replace the supermarket section:

```python
SUPERMARKET_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
SUPERMARKET_B_ID = uuid.UUID("00000000-0000-0000-0000-000000000011")
SUPERMARKET_C_ID = uuid.UUID("00000000-0000-0000-0000-000000000012")
LAYOUT_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")
```

Then find the section in `async def seed(session)` where the supermarket is inserted and replace it with:

```python
SUPERMARKETS = [
    {
        "id": SUPERMARKET_ID,
        "name": "Supermercado A",
        "slug": "supermercado-a",
        "logo_url": None,
        "address": "Av. Central, 100",
        "is_active": True,
    },
    {
        "id": SUPERMARKET_B_ID,
        "name": "Supermercado B",
        "slug": "supermercado-b",
        "logo_url": None,
        "address": None,
        "is_active": True,
    },
    {
        "id": SUPERMARKET_C_ID,
        "name": "Supermercado C",
        "slug": "supermercado-c",
        "logo_url": None,
        "address": None,
        "is_active": True,
    },
]
```

Also update product names to Brazilian grocery items. Find the `PRODUCTS` list and replace all product names with:

```python
PRODUCTS = [
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000001"), "name": "Leite Integral 1L",    "sku": "LEIT001", "category": "Laticínios",   "shelf_id": SHELF_IDS[0]},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000002"), "name": "Queijo Mussarela 500g", "sku": "QUEJ001", "category": "Laticínios",   "shelf_id": SHELF_IDS[0]},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000003"), "name": "Iogurte Natural 170g",  "sku": "IOGR001", "category": "Laticínios",   "shelf_id": SHELF_IDS[0]},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000004"), "name": "Pão de Forma Integral",  "sku": "PAOF001", "category": "Padaria",      "shelf_id": SHELF_IDS[1]},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000005"), "name": "Croissant Folhado",      "sku": "CROI001", "category": "Padaria",      "shelf_id": SHELF_IDS[1]},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000006"), "name": "Frango Inteiro 1kg",     "sku": "FRAN001", "category": "Carnes",       "shelf_id": SHELF_IDS[2]},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000007"), "name": "Alcatra Bovina 500g",    "sku": "ALCA001", "category": "Carnes",       "shelf_id": SHELF_IDS[2]},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000008"), "name": "Tomate Italiano 1kg",    "sku": "TOMA001", "category": "Hortifruti",   "shelf_id": SHELF_IDS[3]},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000009"), "name": "Alface Crespa",          "sku": "ALFA001", "category": "Hortifruti",   "shelf_id": SHELF_IDS[3]},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000010"), "name": "Suco de Laranja 1L",     "sku": "SUCO001", "category": "Bebidas",      "shelf_id": SHELF_IDS[4]},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000011"), "name": "Refrigerante Cola 2L",   "sku": "REFR001", "category": "Bebidas",      "shelf_id": SHELF_IDS[4]},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000012"), "name": "Detergente Líquido 500ml","sku":"DETE001", "category": "Limpeza",      "shelf_id": SHELF_IDS[5]},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000013"), "name": "Sabão em Pó 1kg",        "sku": "SBPO001", "category": "Limpeza",      "shelf_id": SHELF_IDS[5]},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000014"), "name": "Shampoo 400ml",           "sku": "SHAM001", "category": "Higiene",      "shelf_id": SHELF_IDS[6]},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000015"), "name": "Arroz Branco 5kg",        "sku": "ARRZ001", "category": "Mercearia",    "shelf_id": SHELF_IDS[8]},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000016"), "name": "Feijão Carioca 1kg",      "sku": "FEIJ001", "category": "Mercearia",    "shelf_id": SHELF_IDS[8]},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000017"), "name": "Azeite Extra Virgem 500ml","sku":"AZEI001","category": "Mercearia",    "shelf_id": SHELF_IDS[8]},
    {"id": uuid.UUID("50000000-0000-0000-0000-000000000018"), "name": "Sorvete de Baunilha 1L",  "sku": "SORV001", "category": "Congelados",   "shelf_id": SHELF_IDS[7]},
]
```

Note: `SHELF_IDS` is an indexed reference to existing shelf IDs in the seed script — adjust indices to match your shelf ordering.

- [ ] **Step 2: Run seed against SQLite to verify**

```bash
cd server
DATABASE_URL=sqlite+aiosqlite:///./meuguia_seed_test.db python scripts/seed.py
```

Expected output: no errors, rows inserted.

- [ ] **Step 3: Commit**

```bash
git add server/scripts/seed.py
git commit -m "feat(seed): use generic store names, update product list to Brazilian grocery items"
```

---

## Task 11: Run full CI check and push

- [ ] **Step 1: Run the full backend CI suite**

```bash
cd server && python -m pytest tests/ -v
```

Expected: all tests pass.

```bash
cd server && ruff check . && mypy src/
```

Expected: no errors.

- [ ] **Step 2: Push and open PR**

```bash
git push origin feature/phase-8a-supermarket-model
```

Then open a PR from `feature/phase-8a-supermarket-model` → `master` on GitHub.
