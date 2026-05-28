import { http, HttpResponse } from "msw";

const BASE = "http://localhost:8000/api/v1";

// ─── Seed data ────────────────────────────────────────────────────────────────

const MOCK_USER = {
  id: "user-001",
  email: "usuario@example.com",
  full_name: "Usuário Teste",
  role: "CUSTOMER",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

const MOCK_TOKENS = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  token_type: "bearer",
};

const MOCK_LAYOUT = {
  id: "layout-001",
  name: "Loja Central",
  supermarket_id: "super-001",
  width_m: 50,
  height_m: 30,
  created_at: "2026-01-01T00:00:00Z",
};

const MOCK_NODES = [
  { id: "node-001", layout_id: "layout-001", x: 0, y: 0, node_type: "entrance", label: "Entrada" },
  { id: "node-002", layout_id: "layout-001", x: 10, y: 0, node_type: "waypoint", label: null },
  { id: "node-003", layout_id: "layout-001", x: 10, y: 10, node_type: "shelf", label: "Corredor A" },
  { id: "node-004", layout_id: "layout-001", x: 20, y: 10, node_type: "shelf", label: "Corredor B" },
  { id: "node-005", layout_id: "layout-001", x: 50, y: 30, node_type: "exit", label: "Saída" },
];

const MOCK_EDGES = [
  { id: "edge-001", layout_id: "layout-001", node_from_id: "node-001", node_to_id: "node-002", distance_m: 10, bidirectional: true },
  { id: "edge-002", layout_id: "layout-001", node_from_id: "node-002", node_to_id: "node-003", distance_m: 10, bidirectional: true },
  { id: "edge-003", layout_id: "layout-001", node_from_id: "node-003", node_to_id: "node-004", distance_m: 10, bidirectional: true },
  { id: "edge-004", layout_id: "layout-001", node_from_id: "node-004", node_to_id: "node-005", distance_m: 36, bidirectional: true },
];

const MOCK_SHELVES = [
  { id: "shelf-001", layout_id: "layout-001", label: "Laticínios", x: 10, y: 10, width_m: 4, height_m: 2 },
  { id: "shelf-002", layout_id: "layout-001", label: "Padaria", x: 20, y: 10, width_m: 4, height_m: 2 },
];

const MOCK_PRODUCTS = [
  { id: "prod-001", name: "Leite Integral 1L", category: "Laticínios", shelf_id: "shelf-001", price: 5.49, unit: "un" },
  { id: "prod-002", name: "Pão de Forma", category: "Padaria", shelf_id: "shelf-002", price: 8.99, unit: "un" },
  { id: "prod-003", name: "Queijo Minas", category: "Laticínios", shelf_id: "shelf-001", price: 12.9, unit: "kg" },
  { id: "prod-004", name: "Iogurte Natural", category: "Laticínios", shelf_id: "shelf-001", price: 3.79, unit: "un" },
];

const MOCK_GROCERY_LIST = {
  id: "list-001",
  user_id: "user-001",
  layout_id: "layout-001",
  name: "Lista de Compras",
  created_at: "2026-05-01T10:00:00Z",
  item_count: 2,
  items: [
    { id: "item-001", list_id: "list-001", product_id: "prod-001", product_name_snapshot: "Leite Integral 1L", checked: false, sort_order: 0 },
    { id: "item-002", list_id: "list-001", product_id: "prod-002", product_name_snapshot: "Pão de Forma", checked: false, sort_order: 1 },
  ],
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const handlers = [
  // ── Auth ──────────────────────────────────────────────────────────────────

  http.post(`${BASE}/auth/register`, async ({ request }) => {
    const body = await request.json() as { email?: string; password?: string };
    if (!body?.email || !body?.password) {
      return HttpResponse.json({ detail: "Email e senha são obrigatórios" }, { status: 400 });
    }
    return HttpResponse.json(
      { ...MOCK_TOKENS, user: { ...MOCK_USER, email: body.email } },
      { status: 201 },
    );
  }),

  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.formData().catch(() => null);
    const username = body?.get("username");
    const password = body?.get("password");
    if (!username || !password) {
      return HttpResponse.json({ detail: "Credenciais inválidas" }, { status: 401 });
    }
    return HttpResponse.json({ ...MOCK_TOKENS, user: MOCK_USER });
  }),

  http.post(`${BASE}/auth/refresh`, async ({ request }) => {
    const body = await request.json() as { refresh_token?: string };
    if (!body?.refresh_token) {
      return HttpResponse.json({ detail: "refresh_token inválido" }, { status: 401 });
    }
    return HttpResponse.json({
      access_token: "mock-new-access-token",
      refresh_token: "mock-new-refresh-token",
      token_type: "bearer",
    });
  }),

  http.post(`${BASE}/auth/logout`, () => {
    return HttpResponse.json({ message: "ok" });
  }),

  // ── Users ─────────────────────────────────────────────────────────────────

  http.get(`${BASE}/users/me`, () => {
    return HttpResponse.json({
      id: "00000000-0000-0000-0000-000000000001",
      email: "test@example.com",
      role: "CUSTOMER",
    });
  }),

  http.put(`${BASE}/users/me`, async ({ request }) => {
    const body = await request.json() as Partial<typeof MOCK_USER>;
    return HttpResponse.json({ ...MOCK_USER, ...body });
  }),

  // ── Layouts ───────────────────────────────────────────────────────────────

  http.get(`${BASE}/layouts`, () => {
    return HttpResponse.json([MOCK_LAYOUT]);
  }),

  http.get(`${BASE}/layouts/:id`, ({ params }) => {
    if (params.id !== MOCK_LAYOUT.id) {
      return HttpResponse.json({ detail: "Layout não encontrado" }, { status: 404 });
    }
    return HttpResponse.json(MOCK_LAYOUT);
  }),

  http.post(`${BASE}/layouts`, async ({ request }) => {
    const body = await request.json() as Partial<typeof MOCK_LAYOUT>;
    return HttpResponse.json({ ...MOCK_LAYOUT, id: "layout-new", ...body }, { status: 201 });
  }),

  http.put(`${BASE}/layouts/:id`, async ({ params, request }) => {
    if (params.id !== MOCK_LAYOUT.id) {
      return HttpResponse.json({ detail: "Layout não encontrado" }, { status: 404 });
    }
    const body = await request.json() as Partial<typeof MOCK_LAYOUT>;
    return HttpResponse.json({ ...MOCK_LAYOUT, ...body });
  }),

  http.delete(`${BASE}/layouts/:id`, ({ params }) => {
    if (params.id !== MOCK_LAYOUT.id) {
      return HttpResponse.json({ detail: "Layout não encontrado" }, { status: 404 });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE}/layouts/:id/shelves`, ({ params }) => {
    if (params.id !== MOCK_LAYOUT.id) {
      return HttpResponse.json({ detail: "Layout não encontrado" }, { status: 404 });
    }
    return HttpResponse.json(MOCK_SHELVES);
  }),

  http.get(`${BASE}/layouts/:id/download`, ({ params }) => {
    if (params.id !== MOCK_LAYOUT.id) {
      return HttpResponse.json({ detail: "Layout não encontrado" }, { status: 404 });
    }
    return HttpResponse.json({
      layout: MOCK_LAYOUT,
      nodes: MOCK_NODES,
      edges: MOCK_EDGES,
      shelves: MOCK_SHELVES,
      products: MOCK_PRODUCTS,
    });
  }),

  // ── Nodes ─────────────────────────────────────────────────────────────────

  http.get(`${BASE}/layouts/:layout_id/nodes`, ({ params }) => {
    if (params.layout_id !== MOCK_LAYOUT.id) {
      return HttpResponse.json({ detail: "Layout não encontrado" }, { status: 404 });
    }
    return HttpResponse.json(MOCK_NODES);
  }),

  http.post(`${BASE}/layouts/:layout_id/nodes`, async ({ params, request }) => {
    if (params.layout_id !== MOCK_LAYOUT.id) {
      return HttpResponse.json({ detail: "Layout não encontrado" }, { status: 404 });
    }
    const body = await request.json() as { x: number; y: number; node_type: string; label?: string };
    return HttpResponse.json(
      { id: "node-new", layout_id: params.layout_id, ...body },
      { status: 201 },
    );
  }),

  http.delete(`${BASE}/nodes/:node_id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Edges ─────────────────────────────────────────────────────────────────

  http.get(`${BASE}/layouts/:layout_id/edges`, ({ params }) => {
    if (params.layout_id !== MOCK_LAYOUT.id) {
      return HttpResponse.json({ detail: "Layout não encontrado" }, { status: 404 });
    }
    return HttpResponse.json(MOCK_EDGES);
  }),

  http.post(`${BASE}/layouts/:layout_id/edges`, async ({ params, request }) => {
    if (params.layout_id !== MOCK_LAYOUT.id) {
      return HttpResponse.json({ detail: "Layout não encontrado" }, { status: 404 });
    }
    const body = await request.json() as { node_from_id: string; node_to_id: string; distance_m: number; bidirectional?: boolean };
    return HttpResponse.json(
      { id: "edge-new", layout_id: params.layout_id, bidirectional: true, ...body },
      { status: 201 },
    );
  }),

  http.delete(`${BASE}/edges/:edge_id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Shelves ───────────────────────────────────────────────────────────────

  http.get(`${BASE}/shelves`, () => {
    return HttpResponse.json(MOCK_SHELVES);
  }),

  http.get(`${BASE}/shelves/:id`, ({ params }) => {
    const shelf = MOCK_SHELVES.find((s) => s.id === params.id);
    if (!shelf) {
      return HttpResponse.json({ detail: "Prateleira não encontrada" }, { status: 404 });
    }
    return HttpResponse.json(shelf);
  }),

  http.post(`${BASE}/shelves`, async ({ request }) => {
    const body = await request.json() as Partial<typeof MOCK_SHELVES[0]>;
    return HttpResponse.json({ id: "shelf-new", ...body }, { status: 201 });
  }),

  http.put(`${BASE}/shelves/:id`, async ({ params, request }) => {
    const shelf = MOCK_SHELVES.find((s) => s.id === params.id);
    if (!shelf) {
      return HttpResponse.json({ detail: "Prateleira não encontrada" }, { status: 404 });
    }
    const body = await request.json() as Partial<typeof MOCK_SHELVES[0]>;
    return HttpResponse.json({ ...shelf, ...body });
  }),

  http.delete(`${BASE}/shelves/:id`, ({ params }) => {
    const shelf = MOCK_SHELVES.find((s) => s.id === params.id);
    if (!shelf) {
      return HttpResponse.json({ detail: "Prateleira não encontrada" }, { status: 404 });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Products ──────────────────────────────────────────────────────────────

  http.get(`${BASE}/products`, ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLowerCase();
    const category = url.searchParams.get("category");
    const shelfId = url.searchParams.get("shelf_id");
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const size = parseInt(url.searchParams.get("size") ?? "20", 10);

    let filtered = MOCK_PRODUCTS;
    if (q) filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
    if (category) filtered = filtered.filter((p) => p.category === category);
    if (shelfId) filtered = filtered.filter((p) => p.shelf_id === shelfId);

    const start = (page - 1) * size;
    return HttpResponse.json({
      items: filtered.slice(start, start + size),
      total: filtered.length,
      page,
      size,
    });
  }),

  http.get(`${BASE}/products/section/:sectionId`, ({ params }) => {
    const products = MOCK_PRODUCTS.filter((p) => p.shelf_id === params.sectionId);
    return HttpResponse.json(products);
  }),

  http.get(`${BASE}/products/:id`, ({ params }) => {
    const product = MOCK_PRODUCTS.find((p) => p.id === params.id);
    if (!product) {
      return HttpResponse.json({ detail: "Produto não encontrado" }, { status: 404 });
    }
    return HttpResponse.json(product);
  }),

  http.post(`${BASE}/products`, async ({ request }) => {
    const body = await request.json() as Partial<typeof MOCK_PRODUCTS[0]>;
    return HttpResponse.json({ id: "prod-new", ...body }, { status: 201 });
  }),

  http.put(`${BASE}/products/:id`, async ({ params, request }) => {
    const product = MOCK_PRODUCTS.find((p) => p.id === params.id);
    if (!product) {
      return HttpResponse.json({ detail: "Produto não encontrado" }, { status: 404 });
    }
    const body = await request.json() as Partial<typeof MOCK_PRODUCTS[0]>;
    return HttpResponse.json({ ...product, ...body });
  }),

  http.delete(`${BASE}/products/:id`, ({ params }) => {
    const product = MOCK_PRODUCTS.find((p) => p.id === params.id);
    if (!product) {
      return HttpResponse.json({ detail: "Produto não encontrado" }, { status: 404 });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Grocery Lists ─────────────────────────────────────────────────────────

  http.get(`${BASE}/grocery-lists`, () => {
    return HttpResponse.json([
      {
        id: MOCK_GROCERY_LIST.id,
        user_id: MOCK_GROCERY_LIST.user_id,
        layout_id: MOCK_GROCERY_LIST.layout_id,
        name: MOCK_GROCERY_LIST.name,
        created_at: MOCK_GROCERY_LIST.created_at,
        item_count: MOCK_GROCERY_LIST.item_count,
      },
    ]);
  }),

  http.post(`${BASE}/grocery-lists`, async ({ request }) => {
    const body = await request.json() as { layout_id?: string; name?: string };
    return HttpResponse.json(
      {
        id: "list-new",
        user_id: "user-001",
        layout_id: body?.layout_id ?? null,
        name: body?.name ?? "Nova Lista",
        created_at: new Date().toISOString(),
        item_count: 0,
        items: [],
      },
      { status: 201 },
    );
  }),

  http.get(`${BASE}/grocery-lists/:list_id`, ({ params }) => {
    if (params.list_id !== MOCK_GROCERY_LIST.id) {
      return HttpResponse.json({ detail: "Lista não encontrada" }, { status: 404 });
    }
    return HttpResponse.json(MOCK_GROCERY_LIST);
  }),

  http.delete(`${BASE}/grocery-lists/:list_id`, ({ params }) => {
    if (params.list_id !== MOCK_GROCERY_LIST.id) {
      return HttpResponse.json({ detail: "Lista não encontrada" }, { status: 404 });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${BASE}/grocery-lists/:list_id/items`, async ({ params, request }) => {
    if (params.list_id !== MOCK_GROCERY_LIST.id) {
      return HttpResponse.json({ detail: "Lista não encontrada" }, { status: 404 });
    }
    const body = await request.json() as { product_id: string; product_name_snapshot: string };
    return HttpResponse.json(
      {
        id: "item-new",
        list_id: params.list_id,
        product_id: body.product_id,
        product_name_snapshot: body.product_name_snapshot,
        checked: false,
        sort_order: MOCK_GROCERY_LIST.items.length,
      },
      { status: 201 },
    );
  }),

  http.put(`${BASE}/grocery-lists/:list_id/items/:item_id`, async ({ params, request }) => {
    const item = MOCK_GROCERY_LIST.items.find((i) => i.id === params.item_id);
    if (!item) {
      return HttpResponse.json({ detail: "Item não encontrado" }, { status: 404 });
    }
    const body = await request.json() as { checked?: boolean; sort_order?: number };
    return HttpResponse.json({ ...item, ...body });
  }),

  http.delete(`${BASE}/grocery-lists/:list_id/items/:item_id`, ({ params }) => {
    const item = MOCK_GROCERY_LIST.items.find((i) => i.id === params.item_id);
    if (!item) {
      return HttpResponse.json({ detail: "Item não encontrado" }, { status: 404 });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${BASE}/grocery-lists/:list_id/optimize`, ({ params }) => {
    if (params.list_id !== MOCK_GROCERY_LIST.id) {
      return HttpResponse.json({ detail: "Lista não encontrada" }, { status: 404 });
    }
    const optimized = MOCK_GROCERY_LIST.items.map((item, idx) => ({
      ...item,
      sort_order: idx,
    }));
    return HttpResponse.json(optimized);
  }),

  // ── Navigation ────────────────────────────────────────────────────────────

  http.post(`${BASE}/navigation/route`, async ({ request }) => {
    const body = await request.json() as { layout_id: string; start_node_id: string; product_ids: string[] };
    const routeNodes = MOCK_NODES.slice(0, 3).map((n) => ({ ...n, label: n.label ?? "" }));
    return HttpResponse.json({
      layout_id: body?.layout_id ?? MOCK_LAYOUT.id,
      start_node_id: body?.start_node_id ?? "node-001",
      route: routeNodes,
      total_distance_m: 20,
    });
  }),
];
