"""Integration tests for GET /supermarkets endpoints."""
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.layout import Layout
from src.models.supermarket import Supermarket


async def _create_supermarket(
    db: AsyncSession,
    name: str = "Supermercado A",
    slug: str = "supermercado-a",
    is_active: bool = True,
) -> Supermarket:
    """Insert a Supermarket row directly and return the instance."""
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


@pytest.mark.asyncio
async def test_list_layouts_filtered_by_supermarket(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    sm_a = await _create_supermarket(db_session, "Supermercado A", "supermercado-a")
    sm_b = await _create_supermarket(db_session, "Supermercado B", "supermercado-b")
    layout_a = Layout(supermarket_id=sm_a.id, name="Layout A", width_m=50.0, height_m=30.0)
    layout_b = Layout(supermarket_id=sm_b.id, name="Layout B", width_m=40.0, height_m=20.0)
    db_session.add_all([layout_a, layout_b])
    await db_session.commit()
    resp = await client.get(f"/api/v1/layouts?supermarket_id={sm_a.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "Layout A"
