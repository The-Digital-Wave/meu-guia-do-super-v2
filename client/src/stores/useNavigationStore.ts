import { create } from "zustand";
import type { RouteResponse } from "@/types";

interface NavigationState {
  userNodeId: string | null;
  activeRoute: RouteResponse | null;
  isNavigating: boolean;
  setUserNodeId: (nodeId: string | null) => void;
  setActiveRoute: (route: RouteResponse | null) => void;
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
