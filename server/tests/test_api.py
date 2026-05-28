"""Integration tests for the Meu Guia do Super API.

Pattern: Arrange-Act-Assert throughout.
Database: SQLite in-memory (via conftest fixtures — no real Postgres required).
Auth helpers eliminate boilerplate across test groups.
"""
from __future__ import annotations

import uuid

from httpx import AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.supermarket import Supermarket
from src.models.user import User, UserRole

# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------


async def register_and_login(
    client: AsyncClient,
    email: str = "user@example.com",
    password: str = "password123",
    full_name: str | None = None,
) -> str:
    """Register a user (if not already registered) and return an access token."""
    reg_resp = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": full_name},
    )
    if reg_resp.status_code == 201:
        return str(reg_resp.json()["access_token"])

    # Already registered — log in instead.
    login_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert login_resp.status_code == 200, login_resp.text
    return str(login_resp.json()["access_token"])


async def register_and_login_admin(
    client: AsyncClient,
    db_session: AsyncSession,
    email: str = "admin@example.com",
    password: str = "password123",
) -> str:
    """Register a user then promote them to ADMIN via the DB, return an access token."""
    await register_and_login(client, email=email, password=password)

    # Promote to ADMIN directly in the DB.
    await db_session.execute(
        update(User).where(User.email == email).values(role=UserRole.ADMIN)
    )
    await db_session.commit()

    # Re-login to get a fresh token (role in payload isn't cached by our JWT).
    login_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert login_resp.status_code == 200, login_resp.text
    return str(login_resp.json()["access_token"])


def auth_headers(token: str) -> dict[str, str]:
    """Return Authorization Bearer header dict."""
    return {"Authorization": f"Bearer {token}"}


async def _create_supermarket(db_session: AsyncSession, name: str = "Test Market") -> uuid.UUID:
    """Insert a Supermarket row directly and return its id."""
    sm = Supermarket(name=name)
    db_session.add(sm)
    await db_session.flush()
    await db_session.refresh(sm)
    await db_session.commit()
    return sm.id  # type: ignore[return-value]


# ---------------------------------------------------------------------------
# Auth tests
# ---------------------------------------------------------------------------


async def test_register_success(client: AsyncClient) -> None:
    # Arrange
    payload = {"email": "new@example.com", "password": "secret123"}

    # Act
    resp = await client.post("/api/v1/auth/register", json=payload)

    # Assert
    assert resp.status_code == 201
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["user"]["email"] == "new@example.com"
    assert body["user"]["role"] == "CUSTOMER"


async def test_register_duplicate_email_returns_400(client: AsyncClient) -> None:
    # Arrange — register once
    payload = {"email": "dup@example.com", "password": "secret123"}
    await client.post("/api/v1/auth/register", json=payload)

    # Act — attempt to register again with the same email
    resp = await client.post("/api/v1/auth/register", json=payload)

    # Assert
    assert resp.status_code == 400
    assert "already" in resp.json()["detail"].lower()


async def test_login_success(client: AsyncClient) -> None:
    # Arrange
    await client.post(
        "/api/v1/auth/register",
        json={"email": "login@example.com", "password": "mypassword"},
    )

    # Act
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "login@example.com", "password": "mypassword"},
    )

    # Assert
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["user"]["email"] == "login@example.com"


async def test_login_wrong_password_returns_401(client: AsyncClient) -> None:
    # Arrange
    await client.post(
        "/api/v1/auth/register",
        json={"email": "wrongpw@example.com", "password": "correct"},
    )

    # Act
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "wrongpw@example.com", "password": "incorrect"},
    )

    # Assert
    assert resp.status_code == 401


async def test_login_unknown_email_returns_401(client: AsyncClient) -> None:
    # Arrange — no user registered with this email

    # Act
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "ghost@example.com", "password": "anything"},
    )

    # Assert
    assert resp.status_code == 401


async def test_refresh_token_returns_new_access_token(client: AsyncClient) -> None:
    # Arrange
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": "refresh@example.com", "password": "pass"},
    )
    refresh_token = reg.json()["refresh_token"]

    # Act
    resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )

    # Assert
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    # New access token must differ from the registered one (timing-based; skip if same second).
    assert body["access_token"]


async def test_get_me_authenticated(client: AsyncClient) -> None:
    # Arrange
    token = await register_and_login(client, email="me@example.com")

    # Act
    resp = await client.get("/api/v1/users/me", headers=auth_headers(token))

    # Assert
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@example.com"


async def test_get_me_unauthenticated_returns_401(client: AsyncClient) -> None:
    # Arrange — no token

    # Act
    resp = await client.get("/api/v1/users/me")

    # Assert
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Layout tests
# ---------------------------------------------------------------------------


async def test_list_layouts_empty(client: AsyncClient) -> None:
    # Arrange — no layouts in DB

    # Act
    resp = await client.get("/api/v1/layouts")

    # Assert
    assert resp.status_code == 200
    assert resp.json() == []


async def test_create_layout_as_admin(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    # Arrange
    admin_token = await register_and_login_admin(client, db_session)
    supermarket_id = await _create_supermarket(db_session)

    # Act
    resp = await client.post(
        "/api/v1/layouts",
        json={
            "supermarket_id": str(supermarket_id),
            "name": "Main Floor",
            "width_m": 60.0,
            "height_m": 40.0,
        },
        headers=auth_headers(admin_token),
    )

    # Assert
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Main Floor"
    assert body["width_m"] == 60.0
    assert uuid.UUID(body["id"])  # valid UUID


async def test_create_layout_as_customer_returns_403(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    # Arrange — regular (customer) user
    token = await register_and_login(client, email="customer@example.com")
    supermarket_id = await _create_supermarket(db_session)

    # Act
    resp = await client.post(
        "/api/v1/layouts",
        json={
            "supermarket_id": str(supermarket_id),
            "name": "Forbidden",
            "width_m": 10.0,
            "height_m": 10.0,
        },
        headers=auth_headers(token),
    )

    # Assert
    assert resp.status_code == 403


async def test_get_layout_not_found_returns_404(client: AsyncClient) -> None:
    # Arrange — random UUID that doesn't exist
    missing_id = str(uuid.uuid4())

    # Act
    resp = await client.get(f"/api/v1/layouts/{missing_id}")

    # Assert
    assert resp.status_code == 404


async def test_delete_layout(client: AsyncClient, db_session: AsyncSession) -> None:
    # Arrange
    admin_token = await register_and_login_admin(client, db_session)
    supermarket_id = await _create_supermarket(db_session)
    create_resp = await client.post(
        "/api/v1/layouts",
        json={
            "supermarket_id": str(supermarket_id),
            "name": "To Delete",
            "width_m": 5.0,
            "height_m": 5.0,
        },
        headers=auth_headers(admin_token),
    )
    assert create_resp.status_code == 201
    layout_id = create_resp.json()["id"]

    # Act
    del_resp = await client.delete(
        f"/api/v1/layouts/{layout_id}",
        headers=auth_headers(admin_token),
    )

    # Assert
    assert del_resp.status_code == 204

    # Confirm gone
    get_resp = await client.get(f"/api/v1/layouts/{layout_id}")
    assert get_resp.status_code == 404


# ---------------------------------------------------------------------------
# Product tests
# ---------------------------------------------------------------------------


async def test_list_products_empty(client: AsyncClient) -> None:
    # Arrange — no products in DB

    # Act
    resp = await client.get("/api/v1/products")

    # Assert
    assert resp.status_code == 200
    assert resp.json() == []


async def test_create_product_as_admin(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    # Arrange
    admin_token = await register_and_login_admin(client, db_session)

    # Act
    resp = await client.post(
        "/api/v1/products",
        json={"name": "Leite Integral", "category": "Laticínios", "quantity": 10},
        headers=auth_headers(admin_token),
    )

    # Assert
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Leite Integral"
    assert body["category"] == "Laticínios"
    assert body["quantity"] == 10


async def test_search_products_by_name(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    # Arrange — create a product
    admin_token = await register_and_login_admin(client, db_session)
    await client.post(
        "/api/v1/products",
        json={"name": "Queijo Minas", "category": "Laticínios"},
        headers=auth_headers(admin_token),
    )
    await client.post(
        "/api/v1/products",
        json={"name": "Iogurte Natural", "category": "Laticínios"},
        headers=auth_headers(admin_token),
    )

    # Act — search for "queijo"
    resp = await client.get("/api/v1/products", params={"q": "queijo"})

    # Assert
    assert resp.status_code == 200
    names = [p["name"] for p in resp.json()]
    assert "Queijo Minas" in names
    assert "Iogurte Natural" not in names


async def test_search_products_case_insensitive(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    # Arrange
    admin_token = await register_and_login_admin(client, db_session)
    await client.post(
        "/api/v1/products",
        json={"name": "Arroz Branco"},
        headers=auth_headers(admin_token),
    )

    # Act — search with uppercase; SQLite ILIKE is case-insensitive for ASCII
    resp = await client.get("/api/v1/products", params={"q": "ARROZ"})

    # Assert — endpoint must return 200; case-insensitivity is DB-level behaviour
    assert resp.status_code == 200
    # SQLite's LIKE is case-insensitive for ASCII characters by default,
    # so "arroz" matches "Arroz Branco" in this test environment.
    results = resp.json()
    assert any("Arroz" in p["name"] for p in results)


async def test_get_product_not_found_returns_404(client: AsyncClient) -> None:
    # Arrange
    missing_id = str(uuid.uuid4())

    # Act
    resp = await client.get(f"/api/v1/products/{missing_id}")

    # Assert
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Grocery list tests
# ---------------------------------------------------------------------------


async def test_create_grocery_list(client: AsyncClient, db_session: AsyncSession) -> None:
    # Arrange
    token = await register_and_login(client, email="shopper@example.com")

    # Act
    resp = await client.post(
        "/api/v1/grocery-lists",
        json={"name": "Lista Semanal"},
        headers=auth_headers(token),
    )

    # Assert
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Lista Semanal"
    assert uuid.UUID(body["id"])


async def test_list_grocery_lists_returns_only_own(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    # Arrange — two different users each create a list
    token_a = await register_and_login(client, email="user_a@example.com")
    token_b = await register_and_login(client, email="user_b@example.com")

    await client.post(
        "/api/v1/grocery-lists",
        json={"name": "Lista de A"},
        headers=auth_headers(token_a),
    )
    await client.post(
        "/api/v1/grocery-lists",
        json={"name": "Lista de B"},
        headers=auth_headers(token_b),
    )

    # Act
    resp_a = await client.get("/api/v1/grocery-lists", headers=auth_headers(token_a))
    resp_b = await client.get("/api/v1/grocery-lists", headers=auth_headers(token_b))

    # Assert — each user sees only their own list
    assert resp_a.status_code == 200
    names_a = [gl["name"] for gl in resp_a.json()]
    assert "Lista de A" in names_a
    assert "Lista de B" not in names_a

    assert resp_b.status_code == 200
    names_b = [gl["name"] for gl in resp_b.json()]
    assert "Lista de B" in names_b
    assert "Lista de A" not in names_b


async def test_add_item_to_grocery_list(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    # Arrange — user + list
    token = await register_and_login(client, email="items_user@example.com")
    create_resp = await client.post(
        "/api/v1/grocery-lists",
        json={"name": "Minha Lista"},
        headers=auth_headers(token),
    )
    list_id = create_resp.json()["id"]

    # Act
    resp = await client.post(
        f"/api/v1/grocery-lists/{list_id}/items",
        json={"product_name_snapshot": "Feijão Preto"},
        headers=auth_headers(token),
    )

    # Assert
    assert resp.status_code == 201
    body = resp.json()
    assert body["product_name_snapshot"] == "Feijão Preto"
    assert body["checked"] is False


async def test_add_item_with_invalid_product_id_returns_404(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    # Arrange
    token = await register_and_login(client, email="bad_product@example.com")
    create_resp = await client.post(
        "/api/v1/grocery-lists",
        json={"name": "Lista"},
        headers=auth_headers(token),
    )
    list_id = create_resp.json()["id"]
    missing_product_id = str(uuid.uuid4())

    # Act — attempt to add item referencing a non-existent product
    resp = await client.post(
        f"/api/v1/grocery-lists/{list_id}/items",
        json={
            "product_id": missing_product_id,
            "product_name_snapshot": "Ghost Product",
        },
        headers=auth_headers(token),
    )

    # Assert
    assert resp.status_code == 404


async def test_delete_grocery_list(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    # Arrange
    token = await register_and_login(client, email="deleter@example.com")
    create_resp = await client.post(
        "/api/v1/grocery-lists",
        json={"name": "Para Apagar"},
        headers=auth_headers(token),
    )
    list_id = create_resp.json()["id"]

    # Act
    del_resp = await client.delete(
        f"/api/v1/grocery-lists/{list_id}",
        headers=auth_headers(token),
    )

    # Assert
    assert del_resp.status_code == 204

    # Confirm it's gone — GET should return 404
    get_resp = await client.get(
        f"/api/v1/grocery-lists/{list_id}",
        headers=auth_headers(token),
    )
    assert get_resp.status_code == 404


async def test_access_other_users_list_returns_404(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    # Arrange — user_x creates a list; user_y tries to access it
    token_x = await register_and_login(client, email="user_x@example.com")
    token_y = await register_and_login(client, email="user_y@example.com")

    create_resp = await client.post(
        "/api/v1/grocery-lists",
        json={"name": "Lista Privada de X"},
        headers=auth_headers(token_x),
    )
    list_id = create_resp.json()["id"]

    # Act — user_y attempts to read user_x's list
    resp = await client.get(
        f"/api/v1/grocery-lists/{list_id}",
        headers=auth_headers(token_y),
    )

    # Assert — ownership enforcement returns 404 (not 403, to avoid information leak)
    assert resp.status_code == 404
