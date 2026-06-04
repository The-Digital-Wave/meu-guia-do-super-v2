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
- **GET /layouts/:id/download** -> Compiles layout structure into an offline-ready bundle.

  Response body (`200 OK`):
  ```json
  {
    "layout":   { /* LayoutOut */ },
    "nodes":    [ /* NodeOut[] */ ],
    "edges":    [ /* EdgeOut[] */ ],
    "shelves":  [ /* ShelfOut[] — includes width and height */ ],
    "products": [ /* ProductOut[] */ ]
  }
  ```

  `ShelfOut` object shape (within the download bundle):
  ```json
  {
    "id": "uuid",
    "layout_id": "uuid",
    "node_id": "uuid | null",
    "aisle": "string",
    "section": "string",
    "label": "string | null",
    "x": 1.5,
    "y": 3.2,
    "width": 2.0,
    "height": 1.0,
    "color": "#1f6f5f",
    "created_at": "ISO8601"
  }
  ```

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

- **GET /products** -> Fetch inventory with optional filtering. Returns a paginated envelope.

  Query parameters:
  | Parameter  | Type    | Required | Default | Description                                      |
  |------------|---------|----------|---------|--------------------------------------------------|
  | `q`        | string  | no       | —       | Full-text search term matched against product name |
  | `category` | string  | no       | —       | Filter by product category                        |
  | `shelf_id` | string  | no       | —       | Filter by shelf UUID                              |
  | `page`     | integer | no       | 1       | 1-based page number                               |
  | `size`     | integer | no       | 20      | Number of items per page                          |

  Response body (`200 OK`):
  ```json
  {
    "items": [ /* Product[] */ ],
    "total": 42,
    "page": 1,
    "size": 20
  }
  ```

  `Product` object shape:
  ```json
  {
    "id": "uuid",
    "name": "string",
    "sku": "string | null",
    "category": "string | null",
    "image_url": "string | null",
    "shelf_id": "uuid"
  }
  ```

- **GET /products/:id** -> Fetch explicit product metadata.
- **POST /products** -> Register an item type.
- **PUT /products/:id** -> Update pricing, name, or other metadata.
- **DELETE /products/:id** -> Archive/Remove item entry.
- **GET /products/section/:sectionId** -> Returns a sorted array of products mapped inside a localized section zone.

---

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

Also document that `GET /layouts` now accepts an optional `supermarket_id` query parameter (UUID) to filter layouts by supermarket.

---

## 5. Auth

Authentication endpoints for user registration, login, token refresh, and logout.

- **POST /auth/register** -> Registers a new user account; returns access_token, refresh_token, token_type, and user object with id/email/full_name/role. Returns 400 if email already registered.
- **POST /auth/login** -> Accepts OAuth2PasswordRequestForm (username=email, password); returns access_token, refresh_token, token_type, and user object. Returns 401 on invalid credentials.
- **POST /auth/refresh** -> Accepts refresh_token in request body; reissues a new access_token. Returns 401 on invalid or expired refresh token.
- **POST /auth/logout** -> Requires Bearer token in Authorization header; returns success message. No token blacklist in MVP.

---

## 6. Users

Endpoints for the authenticated user to view and update their own profile.

- **GET /users/me** -> Requires Bearer token; returns current user profile with id, email, full_name, role, is_active, created_at. Returns 401 if not authenticated.
- **PUT /users/me** -> Requires Bearer token; accepts optional full_name and email fields; returns updated user profile.

---

## 7. Nodes

Navigation graph node management scoped to a layout.

- **GET /layouts/:layout_id/nodes** -> Returns all nodes for the given layout with id, layout_id, x, y, node_type, label.
- **POST /layouts/:layout_id/nodes** -> Creates a new node; accepts x, y, node_type, optional label; returns created node with 201.
- **DELETE /nodes/:node_id** -> Removes a node by id; returns 204 no content.

`Node` object shape:
```json
{
  "id": "uuid",
  "layout_id": "uuid",
  "x": 1.5,
  "y": 3.2,
  "node_type": "INTERSECTION",
  "label": "string | null"
}
```

`node_type` enumeration — the backend must accept and persist exactly these four string values:

| Value          | Description                                                              |
|----------------|--------------------------------------------------------------------------|
| `INTERSECTION` | A walkway junction with no shelf association                             |
| `SHELF_FRONT`  | The accessible face of a shelf unit; used as a product waypoint          |
| `ENTRY`        | Store or aisle entry point; valid start node for route calculations      |
| `EXIT`         | Store or aisle exit point; valid terminal node for route calculations    |

Any other value must be rejected with `422 Unprocessable Entity`.

---

## 8. Edges

Navigation graph edge management scoped to a layout.

- **GET /layouts/:layout_id/edges** -> Returns all edges for the given layout with id, layout_id, node_from_id, node_to_id, distance_m, bidirectional.
- **POST /layouts/:layout_id/edges** -> Creates a new edge; accepts node_from_id, node_to_id, distance_m, optional bidirectional; returns created edge with 201.
- **DELETE /edges/:edge_id** -> Removes an edge by id; returns 204 no content.

---

## 9. Grocery Lists

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

## 10. Navigation

Route calculation endpoints (stub — full implementation in Phase 3).

- **POST /navigation/route** -> Calculates the shortest path visiting all requested products, starting from the given node.

  Request body:
  ```json
  {
    "layout_id": "uuid",
    "start_node_id": "uuid",
    "product_ids": ["uuid", "uuid"]
  }
  ```

  | Field           | Type       | Required | Description                                             |
  |-----------------|------------|----------|---------------------------------------------------------|
  | `layout_id`     | string     | yes      | UUID of the store layout graph to route within          |
  | `start_node_id` | string     | yes      | UUID of the node where the shopper currently stands     |
  | `product_ids`   | string[]   | yes      | Ordered list of product UUIDs to visit (min 1)          |

  Response body (`200 OK`) — `RouteResponse`:
  ```json
  {
    "layout_id": "uuid",
    "start_node_id": "uuid",
    "waypoints": ["node_uuid_1", "node_uuid_2"],
    "segments": [
      {
        "from_node_id": "uuid",
        "to_node_id": "uuid",
        "product_id": "uuid | null",
        "path_nodes": ["uuid", "uuid", "uuid"],
        "distance_m": 3.5,
        "estimated_seconds": 4,
        "product_name": "string | null",
        "shelf_label": "string | null",
        "shelf_front_node_id": "uuid | null",
        "shelf_front_x": 4.5,
        "shelf_front_y": 2.1
      }
    ],
    "total_distance_m": 12.5,
    "total_estimated_seconds": 15
  }
  ```

  `RouteResponse` field descriptions:

  | Field                    | Type            | Description                                                                  |
  |--------------------------|-----------------|------------------------------------------------------------------------------|
  | `layout_id`              | string          | UUID of the layout the route belongs to                                      |
  | `start_node_id`          | string          | UUID of the starting node supplied in the request                            |
  | `waypoints`              | string[]        | Ordered list of node UUIDs the shopper will pass through (start → end)       |
  | `segments`               | RouteSegment[]  | One segment per leg of the journey (shopper → product stop)                  |
  | `total_distance_m`       | number          | Sum of all segment distances in metres                                        |
  | `total_estimated_seconds`| number          | Estimated total walking time in seconds (assumes ~0.8 m/s average walk speed) |

  `RouteSegment` field descriptions:

  | Field                  | Type          | Description                                                                                          |
  |------------------------|---------------|------------------------------------------------------------------------------------------------------|
  | `from_node_id`         | string        | UUID of the segment start node                                                                       |
  | `to_node_id`           | string        | UUID of the segment end node (the product's shelf_front node)                                        |
  | `product_id`           | string\|null  | UUID of the product reached at `to_node_id`; `null` for intermediate waypoints                       |
  | `path_nodes`           | string[]      | Full ordered list of node UUIDs traversed within this segment                                        |
  | `distance_m`           | number        | Segment distance in metres                                                                            |
  | `estimated_seconds`    | number        | Estimated walking time for this segment in seconds                                                   |
  | `product_name`         | string\|null  | Display name of the product reached at this segment; `null` if no product or join fails              |
  | `shelf_label`          | string\|null  | Human-readable label of the shelf (e.g. "Leite & Derivados"); `null` if unset or join fails          |
  | `shelf_front_node_id`  | string\|null  | UUID of the SHELF_FRONT anchor node; `null` if shelf has no node or join fails                       |
  | `shelf_front_x`        | number\|null  | X coordinate of the shelf_front node in metres; `null` if join fails                                 |
  | `shelf_front_y`        | number\|null  | Y coordinate of the shelf_front node in metres; `null` if join fails                                 |
