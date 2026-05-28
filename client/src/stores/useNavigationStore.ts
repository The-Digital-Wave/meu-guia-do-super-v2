import { create } from "zustand";

interface RouteNode {
  node_id: string;
  x: number;
  y: number;
}

interface RouteSegment {
  from_node_id: string;
  to_node_id: string;
  product_id: string | null;
  path_nodes: string[];
  distance_m: number;
  estimated_seconds: number;
}

interface NavigationState {
  userNodeId: string | null;
  activeRoute: {
    waypoints: string[];
    segments: RouteSegment[];
    total_distance_m: number;
    total_estimated_seconds: number;
  } | null;
  isNavigating: boolean;
  setUserNodeId: (nodeId: string) => void;
  setActiveRoute: (route: NavigationState["activeRoute"]) => void;
  startNavigation: () => void;
  stopNavigation: () => void;
  clearNavigation: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  userNodeId: null,
  activeRoute: null,
  isNavigating: false,

  setUserNodeId: (nodeId) => set({ userNodeId: nodeId }),
  setActiveRoute: (route) => set({ activeRoute: route }),
  startNavigation: () => set({ isNavigating: true }),
  stopNavigation: () => set({ isNavigating: false }),
  clearNavigation: () =>
    set({ userNodeId: null, activeRoute: null, isNavigating: false }),
}));
