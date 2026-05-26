export type Point = {
  x: number;
  y: number;
};

export type ProductPlacement = {
  id: string;
  productId: string;
  pickNodeId?: string | null;
  sectionIndex: number;
  quantity: number;
  aisleHint?: string | null;
  product: {
    id: string;
    name: string;
    brand?: string | null;
    category?: string | null;
  };
};

export type Shelf = {
  id: string;
  accessNodeId?: string | null;
  name: string;
  sectionName: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  racks: number;
  sections: number;
  placements: ProductPlacement[];
};

export type IndoorNodeType = "ENTRANCE" | "INTERSECTION" | "PICKUP" | "CHECKOUT" | "WAYPOINT";

export type IndoorNode = {
  id: string;
  code: string;
  type: IndoorNodeType;
  x: number;
  y: number;
};

export type IndoorEdge = {
  fromNodeId: string;
  toNodeId: string;
  distanceMeters: number;
  bidirectional: boolean;
  speedFactor: number;
  accessibilityScore: number;
};

export type Layout = {
  id: string;
  supermarketId: string;
  name: string;
  description?: string | null;
  width: number;
  height: number;
  unit: string;
  navigationNodes?: IndoorNode[];
  navigationEdges?: IndoorEdge[];
  shelves: Shelf[];
};

export type Supermarket = {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  entranceX: number;
  entranceY: number;
  layout?: Layout | null;
};

export type Product = {
  id: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  description?: string | null;
  placements: Array<{
    id: string;
    quantity: number;
    sectionIndex: number;
    shelf: Shelf;
  }>;
};

export type PreviewRoute = {
  startNode?: {
    id: string;
    code: string;
    point: Point;
  };
  distance?: number;
  nodeIds?: string[];
  target: {
    productId: string;
    productName: string;
    shelfName: string;
    sectionName: string;
    point: Point;
  };
  points: Point[];
};

export type OptimizedRoute = {
  startNode?: {
    id: string;
    code: string;
    point: Point;
  };
  unresolvedProducts?: string[];
  totalDistance: number;
  orderedItems: Array<{
    step: number;
    productId: string;
    productName: string;
    shelfName: string;
    sectionName: string;
    distance: number;
  }>;
  segments: Array<{
    productId: string;
    productName: string;
    shelfName: string;
    sectionName: string;
    distance: number;
    nodeIds?: string[];
    points: Point[];
  }>;
};

export type AdminSession = {
  token: string;
  admin: {
    id: string;
    name: string;
    email: string;
  };
};
