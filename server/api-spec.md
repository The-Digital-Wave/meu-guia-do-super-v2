# API Endpoint Specifications (v1 Contract)

All endpoints must handle request validation via Pydantic v2 and communicate strictly using JSON payloads.

All v1 routes are prefixed with `/api/v1`.

---

## 1. Layouts

Manage top-level store or warehouse physical grid arrangements.

- **GET /layouts** -> Returns a list of all layouts.
- **GET /layouts/:id** -> Returns a single layout object.
- **POST /layouts** -> Creates a new layout.
- **PUT /layouts/:id** -> Updates layout metadata.
- **DELETE /layouts/:id** -> Destroys layout and triggers cascading cleanup flags for orphaned components.
- **GET /layouts/:id/shelves** -> Custom relational query gathering all associated shelf child entities.
- **GET /layouts/:id/download** -> Compiles layout structure into an offline-ready format.

---

## 2. Shelves

Physical shelf holding items assigned to a parent layout grid.

- **GET /shelves** -> List all active shelves.
- **GET /shelves/:id** -> View shelf properties by identity.
- **POST /shelves** -> Create a shelf.
- **PUT /shelves/:id** -> Modify positional or structural parameters.
- **DELETE /shelves/:id** -> Removes record.

---

## 3. Products

Inventory items tracked across physical locations.

- **GET /products** -> Fetch inventory with optional filtering by search term (q), category, or shelf_id query params.
- **GET /products/:id** -> Fetch explicit product metadata.
- **POST /products** -> Register an item type.
- **PUT /products/:id** -> Update pricing, name, or other metadata.
- **DELETE /products/:id** -> Archive/Remove item entry.
- **GET /products/section/:sectionId** -> Returns a sorted array of products mapped inside a localized section zone.

---

## 4. Auth

Authentication endpoints for user registration, login, token refresh, and logout.

- **POST /auth/register** -> Registers a new user account; returns access_token, refresh_token, token_type, and user object with id/email/full_name/role. Returns 400 if email already registered.
- **POST /auth/login** -> Accepts OAuth2PasswordRequestForm (username=email, password); returns access_token, refresh_token, token_type, and user object. Returns 401 on invalid credentials.
- **POST /auth/refresh** -> Accepts refresh_token in request body; reissues a new access_token. Returns 401 on invalid or expired refresh token.
- **POST /auth/logout** -> Requires Bearer token in Authorization header; returns success message. No token blacklist in MVP.

---

## 5. Users

Endpoints for the authenticated user to view and update their own profile.

- **GET /users/me** -> Requires Bearer token; returns current user profile with id, email, full_name, role, is_active, created_at. Returns 401 if not authenticated.
- **PUT /users/me** -> Requires Bearer token; accepts optional full_name and email fields; returns updated user profile.

---

## 6. Nodes

Navigation graph node management scoped to a layout.

- **GET /layouts/:layout_id/nodes** -> Returns all nodes for the given layout with id, layout_id, x, y, node_type, label.
- **POST /layouts/:layout_id/nodes** -> Creates a new node; accepts x, y, node_type, optional label; returns created node with 201.
- **DELETE /nodes/:node_id** -> Removes a node by id; returns 204 no content.

---

## 7. Edges

Navigation graph edge management scoped to a layout.

- **GET /layouts/:layout_id/edges** -> Returns all edges for the given layout with id, layout_id, node_from_id, node_to_id, distance_m, bidirectional.
- **POST /layouts/:layout_id/edges** -> Creates a new edge; accepts node_from_id, node_to_id, distance_m, optional bidirectional; returns created edge with 201.
- **DELETE /edges/:edge_id** -> Removes an edge by id; returns 204 no content.

---

## 8. Grocery Lists

Authenticated user grocery list management with per-item CRUD and route optimization stub.

- **GET /grocery-lists** -> Requires Bearer token; returns list of user's grocery lists with id, user_id, layout_id, name, created_at, item_count.
- **POST /grocery-lists** -> Requires Bearer token; accepts optional layout_id and name; returns created list with 201.
- **GET /grocery-lists/:list_id** -> Requires Bearer token; returns grocery list with nested items array.
- **DELETE /grocery-lists/:list_id** -> Requires Bearer token; deletes grocery list; returns 204 no content.
- **POST /grocery-lists/:list_id/items** -> Requires Bearer token; accepts product_id and product_name_snapshot; returns created item with 201.
- **PUT /grocery-lists/:list_id/items/:item_id** -> Requires Bearer token; accepts optional checked and sort_order; returns updated item.
- **DELETE /grocery-lists/:list_id/items/:item_id** -> Requires Bearer token; removes item from list; returns 204 no content.
- **POST /grocery-lists/:list_id/optimize** -> Requires Bearer token; optimizes item sort_order for in-store navigation route; returns items array with updated sort_order.

---

## 9. Navigation

Route calculation endpoints (stub — full implementation in Phase 3).

- **POST /navigation/route** -> Accepts layout_id, start_node_id, and product_ids array; returns shortest path as array of nodes with x/y/label coordinates and total_distance_m.
