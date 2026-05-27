# API Endpoint Specifications (v1 Contract)

All endpoints must handle request validation via Pydantic v2 and communicate strictly using JSON payloads.

## 1. Layouts

Manage top-level store or warehouse physical grid arrangements.

- **GET /layouts** -> Returns a list of all layouts.
- **GET /layouts/:id** -> Returns a single layout object.
- **POST /layouts** -> Creates a new layout.
- **PUT /layouts/:id** -> Updates layout metadata.
- **DELETE /layouts/:id** -> Destroys layout and triggers cascading cleanup flags for orphaned components.
- **GET /layouts/:id/shelves** -> Custom relational query gathering all associated shelf child entities.
- **GET /layouts/:id/download** -> Compiles layout structure into an offline-ready format.

## 2. Shelves

Physical shelf holding items assigned to a parent layout grid.

- **GET /shelves** -> List all active shelves.
- **GET /shelves/:id** -> View shelf properties by identity.
- **POST /shelves** -> Create a shelf.
- **PUT /shelves/:id** -> Modify positional or structural parameters.
- **DELETE /shelves/:id** -> Removes record.

## 3. Products

Inventory items tracked across physical locations.

- **GET /products** -> Fetch complete inventory tracking data.
- **GET /products/:id** -> Fetch explicit product metadata.
- **POST /products** -> Register an item type.
- **PUT /products/:id** -> Update pricing, name, or other metadata.
- **DELETE /products/:id** -> Archive/Remove item entry.
- **GET /products/section/:sectionId** -> Returns a sorted array of products mapped inside a localized section zone.
