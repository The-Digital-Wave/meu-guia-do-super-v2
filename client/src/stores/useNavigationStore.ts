import { create } from "zustand";
import type { RouteResponse } from "@/types";

export type NavigationPhase = "idle" | "routing" | "arrived";

interface NavigationState {
  // Position + route data
  userNodeId:      string | null;
  activeRoute:     RouteResponse | null;
  // State machine
  phase:           NavigationPhase;
  activeStepIndex: number;
  // Phase 7: bearing for map orientation
  bearingDeg:      number;
  // Setters
  setUserNodeId:   (nodeId: string | null) => void;
  setActiveRoute:  (route: RouteResponse | null) => void;
  setBearing:      (deg: number) => void;
  // State machine transitions
  startNavigation: () => void;                // idle → routing
  advance:         () => void;                // routing → routing (next step) or arrived
  cancelNavigation: () => void;              // routing → idle
  clearNavigation: () => void;               // reset everything → idle
  // Legacy compat — maps to phase === "routing"
  isNavigating:    boolean;
  startNavigation_legacy: () => void;
  stopNavigation:  () => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  userNodeId:      null,
  activeRoute:     null,
  phase:           "idle",
  activeStepIndex: 0,
  bearingDeg:      0,
  isNavigating:    false,

  setUserNodeId: (nodeId) => set({ userNodeId: nodeId }),

  setBearing: (deg) => set({ bearingDeg: deg }),

  setActiveRoute: (route) =>
    set({ activeRoute: route, phase: route ? "idle" : "idle", activeStepIndex: 0 }),

  startNavigation: () =>
    set({ phase: "routing", activeStepIndex: 0, isNavigating: true }),

  advance: () => {
    const { activeRoute, activeStepIndex } = get();
    if (!activeRoute) return;
    const nextIndex = activeStepIndex + 1;
    if (nextIndex >= activeRoute.segments.length) {
      set({ phase: "arrived" });
    } else {
      set({ activeStepIndex: nextIndex });
    }
  },

  cancelNavigation: () =>
    set({ phase: "idle", activeStepIndex: 0, isNavigating: false }),

  clearNavigation: () =>
    set({
      userNodeId:      null,
      activeRoute:     null,
      phase:           "idle",
      activeStepIndex: 0,
      isNavigating:    false,
    }),

  // Legacy compat — existing screens use startNavigation / stopNavigation
  startNavigation_legacy: () =>
    set({ phase: "routing", isNavigating: true }),

  stopNavigation: () =>
    set({ phase: "idle", isNavigating: false }),
}));
