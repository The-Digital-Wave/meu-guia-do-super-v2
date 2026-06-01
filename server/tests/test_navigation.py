"""Navigation service and endpoint tests.

Unit tests: pure algorithm (no DB required).
Integration tests: SQLite in-memory via conftest fixtures.

Pattern: Arrange-Act-Assert throughout.
"""
from __future__ import annotations

import uuid
from typing import Any

import networkx as nx
import pytest
from httpx import AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import User, UserRole
from src.services.navigation_service import nearest_neighbor_tsp

# ---------------------------------------------------------------------------
# Re-use auth helpers from test_api (inline copies to keep this file self-contained)
# ---------------------------------------------------------------------------


async def _register_and_login(
    client: AsyncClient,
    email: str = "nav_user@example.com",
    password: str = "password123",
) -> str:
    reg_resp = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    if reg_resp.status_code == 201:
        return str(reg_resp.json()["access_token"])

    login_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert login_resp.status_code == 200, login_resp.text
    return str(login_resp.json()["access_token"])


async def _register_and_login_admin(
    client: AsyncClient,
    db_session: AsyncSession,
    email: str = "nav_admin@example.com",
    password: str = "password123",
) -> str:
    await _register_and_login(client, email=email, password=password)
    await db_session.execute(
        update(User).where(User.email == email).values(role=UserRole.ADMIN)
    )
    await db_session.commit()
    login_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert login_resp.status_code == 200, login_resp.text
    return str(login_resp.json()["access_token"])


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Helpers to seed layout + graph data in the test DB via the API
# ---------------------------------------------------------------------------


async def _seed_layout_graph(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_token: str,
) -> dict[str, Any]:
    """Seed a minimal but fully-connected layout with nodes, edges, shelf, product.

    Graph topology (all bidirectional, weights = distance in metres):
        ENTRY(A) --2m-- INTERSECTION(B) --3m-- SHELF_FRONT(C)
                         |
                        4m
                         |
                    SHELF_FRONT(D)

    Returns dict with layout_id, node ids (A/B/C/D), shelf_id, product_id.
    """
    # Create supermarket directly in DB
    from src.models.supermarket import Supermarket as SM

    sm = SM(name="Test Market Nav")
    db_session.add(sm)
    await db_session.flush()
    await db_session.refresh(sm)
    await db_session.commit()

    # Layout
    layout_resp = await client.post(
        "/api/v1/layouts",
        json={
            "supermarket_id": str(sm.id),
            "name": "Nav Test Layout",
            "width_m": 20.0,
            "height_m": 20.0,
        },
        headers=_auth(admin_token),
    )
    assert layout_resp.status_code == 201, layout_resp.text
    layout_id = layout_resp.json()["id"]

    # Nodes
    async def _node(x: float, y: float, node_type: str, label: str) -> str:
        r = await client.post(
            f"/api/v1/layouts/{layout_id}/nodes",
            json={"x": x, "y": y, "node_type": node_type, "label": label},
            headers=_auth(admin_token),
        )
        assert r.status_code == 201, r.text
        return str(r.json()["id"])

    node_a = await _node(0, 0, "ENTRY", "Entry")
    node_b = await _node(2, 0, "INTERSECTION", "Junction")
    node_c = await _node(5, 0, "SHELF_FRONT", "Shelf C front")
    node_d = await _node(2, 4, "SHELF_FRONT", "Shelf D front")

    # Edges (bidirectional = True by default)
    async def _edge(from_id: str, to_id: str, dist: float) -> None:
        r = await client.post(
            f"/api/v1/layouts/{layout_id}/edges",
            json={
                "node_from_id": from_id,
                "node_to_id": to_id,
                "distance_m": dist,
                "bidirectional": True,
            },
            headers=_auth(admin_token),
        )
        assert r.status_code == 201, r.text

    await _edge(node_a, node_b, 2.0)
    await _edge(node_b, node_c, 3.0)
    await _edge(node_b, node_d, 4.0)

    # Shelf anchored to node_c
    shelf_resp = await client.post(
        "/api/v1/shelves",
        json={
            "layout_id": layout_id,
            "node_id": node_c,
            "aisle": "A1",
            "section": "Dairy",
            "label": "Dairy shelf",
        },
        headers=_auth(admin_token),
    )
    assert shelf_resp.status_code == 201, shelf_resp.text
    shelf_id = shelf_resp.json()["id"]

    # Product on that shelf
    product_resp = await client.post(
        "/api/v1/products",
        json={
            "name": "Test Milk",
            "category": "Dairy",
            "shelf_id": shelf_id,
        },
        headers=_auth(admin_token),
    )
    assert product_resp.status_code == 201, product_resp.text
    product_id = product_resp.json()["id"]

    return {
        "layout_id": layout_id,
        "node_a": node_a,
        "node_b": node_b,
        "node_c": node_c,
        "node_d": node_d,
        "shelf_id": shelf_id,
        "product_id": product_id,
    }


# ===========================================================================
# UNIT TESTS — pure algorithm, no DB
# ===========================================================================


class TestDijkstraUnit:
    """Pure graph tests using nearest_neighbor_tsp (which calls nx.dijkstra_path_length)."""

    def _build_graph(self) -> nx.DiGraph:
        """Known topology: A→B(1m), A→C(5m), B→C(1m), C→D(1m)."""
        g: nx.DiGraph = nx.DiGraph()
        a, b, c, d = uuid.uuid4(), uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
        g.add_node(a)
        g.add_node(b)
        g.add_node(c)
        g.add_node(d)
        g.add_edge(a, b, weight=1.0)
        g.add_edge(b, a, weight=1.0)
        g.add_edge(a, c, weight=5.0)
        g.add_edge(c, a, weight=5.0)
        g.add_edge(b, c, weight=1.0)
        g.add_edge(c, b, weight=1.0)
        g.add_edge(c, d, weight=1.0)
        g.add_edge(d, c, weight=1.0)
        return g, a, b, c, d  # type: ignore[return-value]

    def test_dijkstra_finds_shortest_path(self) -> None:
        """A→D shortest path should be A→B→C→D = 3m, not A→C→D = 6m."""
        g, a, b, c, d = self._build_graph()
        # Verify path length via networkx directly
        length = nx.dijkstra_path_length(g, a, d, weight="weight")
        assert length == pytest.approx(3.0)
        path = nx.dijkstra_path(g, a, d, weight="weight")
        assert path == [a, b, c, d]

    def test_dijkstra_direct_edge_used_when_shorter(self) -> None:
        """A→C: direct is 5m vs A→B→C = 2m; should pick A→B→C."""
        g, a, b, c, d = self._build_graph()
        length = nx.dijkstra_path_length(g, a, c, weight="weight")
        assert length == pytest.approx(2.0)


class TestNearestNeighborTSP:
    """Unit tests for the nearest_neighbor_tsp heuristic."""

    def _make_graph(self) -> tuple[nx.DiGraph, uuid.UUID, uuid.UUID, uuid.UUID]:
        """Star graph: A→B (1m), A→C (10m), B→C (1m)."""
        g: nx.DiGraph = nx.DiGraph()
        a, b, c = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
        for u, v, w in [(a, b, 1.0), (b, a, 1.0), (a, c, 10.0), (c, a, 10.0),
                        (b, c, 1.0), (c, b, 1.0)]:
            g.add_edge(u, v, weight=w)
        return g, a, b, c

    def test_nearest_neighbor_orders_closer_first(self) -> None:
        """Start=A, targets=[C, B]. B is closer (1m) so should come before C."""
        g, a, b, c = self._make_graph()
        result = nearest_neighbor_tsp(g, a, [c, b])
        assert result == [b, c]

    def test_nearest_neighbor_single_target(self) -> None:
        """Single target should return [target] regardless of distance."""
        g, a, b, c = self._make_graph()
        result = nearest_neighbor_tsp(g, a, [c])
        assert result == [c]

    def test_nearest_neighbor_empty_targets(self) -> None:
        """Empty target list returns empty list."""
        g, a, b, c = self._make_graph()
        result = nearest_neighbor_tsp(g, a, [])
        assert result == []

    def test_nearest_neighbor_unreachable_raises(self) -> None:
        """If a target is unreachable, ValueError is raised."""
        g: nx.DiGraph = nx.DiGraph()
        a, b = uuid.uuid4(), uuid.uuid4()
        g.add_node(a)
        g.add_node(b)  # isolated — no edge from a
        with pytest.raises(ValueError, match="No path"):
            nearest_neighbor_tsp(g, a, [b])


# ===========================================================================
# INTEGRATION TESTS — SQLite in-memory, full HTTP stack
# ===========================================================================


@pytest.mark.asyncio
async def test_route_endpoint_unauthenticated_allowed_returns_404_for_missing_layout(
    client: AsyncClient,
) -> None:
    """POST /navigation/route is public (spec §9 — no auth required).

    An unauthenticated request with a random layout_id must reach the service
    layer and return 404 (layout not found), not 401.
    """
    # Arrange
    payload = {
        "layout_id": str(uuid.uuid4()),
        "start_node_id": str(uuid.uuid4()),
        "product_ids": [str(uuid.uuid4())],
    }

    # Act
    resp = await client.post("/api/v1/navigation/route", json=payload)

    # Assert — endpoint is public; 404 because the random layout doesn't exist
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_route_endpoint_missing_layout_returns_404(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """POST /navigation/route with non-existent layout_id returns 404."""
    # Arrange
    token = await _register_and_login(client, email="nav404@example.com")
    payload = {
        "layout_id": str(uuid.uuid4()),
        "start_node_id": str(uuid.uuid4()),
        "product_ids": [str(uuid.uuid4())],
    }

    # Act
    resp = await client.post(
        "/api/v1/navigation/route",
        json=payload,
        headers=_auth(token),
    )

    # Assert
    assert resp.status_code in (404, 422)


@pytest.mark.asyncio
async def test_route_endpoint_empty_product_ids_returns_422(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """POST /navigation/route with empty product_ids returns 422 (validation error)."""
    # Arrange
    token = await _register_and_login(client, email="nav_empty@example.com")
    payload = {
        "layout_id": str(uuid.uuid4()),
        "start_node_id": str(uuid.uuid4()),
        "product_ids": [],
    }

    # Act
    resp = await client.post(
        "/api/v1/navigation/route",
        json=payload,
        headers=_auth(token),
    )

    # Assert
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_route_endpoint_returns_200(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Full happy-path: seed layout+graph, POST /navigation/route, assert 200 + shape."""
    # Arrange
    admin_token = await _register_and_login_admin(
        client, db_session, email="nav_admin_happy@example.com"
    )
    user_token = await _register_and_login(client, email="nav_user_happy@example.com")

    seeds = await _seed_layout_graph(client, db_session, admin_token)

    payload = {
        "layout_id": seeds["layout_id"],
        "start_node_id": seeds["node_a"],
        "product_ids": [seeds["product_id"]],
    }

    # Act
    resp = await client.post(
        "/api/v1/navigation/route",
        json=payload,
        headers=_auth(user_token),
    )

    # Assert
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["layout_id"] == seeds["layout_id"]
    assert body["start_node_id"] == seeds["node_a"]
    assert len(body["segments"]) == 1
    segment = body["segments"][0]
    assert segment["from_node_id"] == seeds["node_a"]
    assert segment["to_node_id"] == seeds["node_c"]
    assert segment["product_id"] == seeds["product_id"]
    assert segment["distance_m"] == pytest.approx(5.0)  # A→B(2m) + B→C(3m)
    assert segment["estimated_seconds"] > 0
    assert body["total_distance_m"] == pytest.approx(5.0)
    assert isinstance(body["waypoints"], list)
    assert len(body["waypoints"]) >= 2


@pytest.mark.asyncio
async def test_optimize_grocery_list_reorders_items(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Create grocery list with 2 products, optimize, assert items have updated sort_order."""
    # Arrange
    admin_token = await _register_and_login_admin(
        client, db_session, email="opt_admin@example.com"
    )
    user_token = await _register_and_login(client, email="opt_user@example.com")

    seeds = await _seed_layout_graph(client, db_session, admin_token)

    # Create a second shelf+product anchored to node_d
    shelf2_resp = await client.post(
        "/api/v1/shelves",
        json={
            "layout_id": seeds["layout_id"],
            "node_id": seeds["node_d"],
            "aisle": "A2",
            "section": "Bakery",
            "label": "Bakery shelf",
        },
        headers=_auth(admin_token),
    )
    assert shelf2_resp.status_code == 201, shelf2_resp.text
    shelf2_id = shelf2_resp.json()["id"]

    product2_resp = await client.post(
        "/api/v1/products",
        json={"name": "Test Bread", "category": "Bakery", "shelf_id": shelf2_id},
        headers=_auth(admin_token),
    )
    assert product2_resp.status_code == 201, product2_resp.text
    product2_id = product2_resp.json()["id"]

    # Create grocery list with layout_id
    list_resp = await client.post(
        "/api/v1/grocery-lists",
        json={"name": "Opt Test List", "layout_id": seeds["layout_id"]},
        headers=_auth(user_token),
    )
    assert list_resp.status_code == 201, list_resp.text
    list_id = list_resp.json()["id"]

    # Add items — intentionally reversed order (bakery first, then dairy)
    await client.post(
        f"/api/v1/grocery-lists/{list_id}/items",
        json={"product_id": product2_id, "product_name_snapshot": "Test Bread"},
        headers=_auth(user_token),
    )
    await client.post(
        f"/api/v1/grocery-lists/{list_id}/items",
        json={
            "product_id": seeds["product_id"],
            "product_name_snapshot": "Test Milk",
        },
        headers=_auth(user_token),
    )

    # Act
    opt_resp = await client.post(
        f"/api/v1/grocery-lists/{list_id}/optimize",
        headers=_auth(user_token),
    )

    # Assert
    assert opt_resp.status_code == 200, opt_resp.text
    body = opt_resp.json()
    assert body["id"] == list_id
    items = body["items"]
    assert len(items) == 2
    # Graph distances from Entry(A):
    #   node_c (Dairy/Milk): A→B(2m) + B→C(3m) = 5m  ← closer
    #   node_d (Bakery/Bread): A→B(2m) + B→D(4m) = 6m ← farther
    # TSP nearest-neighbor must visit Milk before Bread.
    closer_item = next(i for i in items if i["product_id"] == seeds["product_id"])
    farther_item = next(i for i in items if i["product_id"] == product2_id)
    assert closer_item["sort_order"] < farther_item["sort_order"]


@pytest.mark.asyncio
async def test_optimize_grocery_list_no_layout_returns_422(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Optimising a list with no layout_id returns 422."""
    # Arrange
    token = await _register_and_login(client, email="no_layout@example.com")
    list_resp = await client.post(
        "/api/v1/grocery-lists",
        json={"name": "No Layout List"},
        headers=_auth(token),
    )
    assert list_resp.status_code == 201
    list_id = list_resp.json()["id"]

    # Act
    resp = await client.post(
        f"/api/v1/grocery-lists/{list_id}/optimize",
        headers=_auth(token),
    )

    # Assert
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_optimize_grocery_list_unauthenticated_returns_401(
    client: AsyncClient,
) -> None:
    """POST /grocery-lists/{id}/optimize without token returns 401."""
    # Arrange
    fake_id = str(uuid.uuid4())

    # Act
    resp = await client.post(f"/api/v1/grocery-lists/{fake_id}/optimize")

    # Assert
    assert resp.status_code == 401
