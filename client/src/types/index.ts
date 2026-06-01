export interface Layout {
  id: string;
  supermarket_id: string;
  name: string;
  width_m: number;
  height_m: number;
  image_url: string | null;
}

export interface Node {
  id: string;
  layout_id: string;
  x: number; // meters
  y: number; // meters
  node_type: "INTERSECTION" | "SHELF_FRONT" | "ENTRY" | "EXIT";
  label: string | null;
}

export interface Edge {
  id: string;
  layout_id: string;
  node_from_id: string;
  node_to_id: string;
  distance_m: number;
  bidirectional: boolean;
}

export interface Shelf {
  id: string;
  layout_id: string;
  node_id: string | null;  // null when shelf has no navigation anchor yet
  aisle: string;
  section: string;
  label: string | null;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  image_url: string | null;
  shelf_id: string | null;        // null when product has no shelf assignment
  brand: string | null;
  description: string | null;
  quantity: number;
  section_index: number | null;
  shelf?: Shelf;
}

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  size: number;
}

export interface GroceryItem {
  id: string;
  product_id: string;
  product_name_snapshot: string;
  sort_order: number;
  checked: boolean;
}

export interface GroceryList {
  id: string;
  user_id: string;
  layout_id: string | null;
  name: string | null;
  created_at: string;
  items: GroceryItem[];
}

export interface RouteSegment {
  from_node_id: string;
  to_node_id: string;
  product_id: string | null;
  path_nodes: string[];
  distance_m: number;
  estimated_seconds: number;
  // Phase 7: enriched by server
  product_name: string | null;
  shelf_label: string | null;
  shelf_front_node_id: string | null;
  shelf_front_x: number | null;
  shelf_front_y: number | null;
}

export interface RouteResponse {
  layout_id: string;
  start_node_id: string;
  waypoints: string[];
  segments: RouteSegment[];
  total_distance_m: number;
  total_estimated_seconds: number;
}

export interface LayoutBundle {
  layout: Layout;
  nodes: Node[];
  edges: Edge[];
  shelves: Shelf[];
  products: Product[];
}
