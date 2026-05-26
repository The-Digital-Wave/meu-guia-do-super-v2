import { create } from "zustand";

import type { OptimizedRoute, Point, Product, PreviewRoute, Supermarket } from "../types/domain";

type CartItem = {
  productId: string;
  name: string;
  shelfName: string;
  picked: boolean;
};

type AppState = {
  selectedSupermarket?: Supermarket;
  currentPosition?: Point;
  previewRoute?: PreviewRoute;
  optimizedRoute?: OptimizedRoute;
  cart: CartItem[];
  drawerOpen: boolean;
  setSelectedSupermarket: (supermarket?: Supermarket) => void;
  setCurrentPosition: (point: Point) => void;
  setPreviewRoute: (route?: PreviewRoute) => void;
  setOptimizedRoute: (route?: OptimizedRoute) => void;
  addToCart: (product: Product) => void;
  toggleCartItem: (productId: string) => void;
  setDrawerOpen: (open: boolean) => void;
  resetRoutes: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  cart: [],
  drawerOpen: true,
  setSelectedSupermarket: (supermarket) =>
    set({
      selectedSupermarket: supermarket,
      currentPosition: supermarket ? { x: supermarket.entranceX, y: supermarket.entranceY } : undefined,
      previewRoute: undefined,
      optimizedRoute: undefined,
      cart: [],
    }),
  setCurrentPosition: (point) => set({ currentPosition: point }),
  setPreviewRoute: (route) => set({ previewRoute: route }),
  setOptimizedRoute: (route) => set({ optimizedRoute: route }),
  addToCart: (product) =>
    set((state) => {
      if (state.cart.some((item) => item.productId === product.id)) {
        return state;
      }

      const firstPlacement = product.placements[0];
      return {
        cart: [
          ...state.cart,
          {
            productId: product.id,
            name: product.name,
            shelfName: firstPlacement?.shelf.name ?? "Sem estante",
            picked: false,
          },
        ],
      };
    }),
  toggleCartItem: (productId) =>
    set((state) => ({
      cart: state.cart.map((item) => (item.productId === productId ? { ...item, picked: !item.picked } : item)),
    })),
  setDrawerOpen: (open) => set({ drawerOpen: open }),
  resetRoutes: () => set({ previewRoute: undefined, optimizedRoute: undefined }),
}));
