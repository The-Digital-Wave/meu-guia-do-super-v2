import { create } from "zustand";
import type { Product } from "@/types";

export interface CartItem {
  id: string;
  product_id: string;
  product_name_snapshot: string;
  category: string | null;
  sort_order: number;
  checked: boolean;
}

interface GroceryListState {
  items: CartItem[];
  isEphemeral: boolean;

  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  toggleItem: (productId: string) => void;
  reorderItems: (newItems: CartItem[]) => void;
  setEphemeral: (value: boolean) => void;
  clearList: () => void;
}

export const useGroceryListStore = create<GroceryListState>((set, get) => ({
  items: [],
  isEphemeral: false,

  addItem: (product) => {
    const { items } = get();
    if (items.find((i) => i.product_id === product.id)) return;
    const newItem: CartItem = {
      id: product.id,
      product_id: product.id,
      product_name_snapshot: product.name,
      category: product.category ?? null,
      sort_order: items.length,
      checked: false,
    };
    set({ items: [...items, newItem] });
  },

  removeItem: (productId) =>
    set((state) => ({
      items: state.items
        .filter((i) => i.product_id !== productId)
        .map((item, index) => ({ ...item, sort_order: index })),
    })),

  toggleItem: (productId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.product_id === productId ? { ...item, checked: !item.checked } : item
      ),
    })),

  reorderItems: (newItems) => set({ items: newItems }),

  setEphemeral: (value) => set({ isEphemeral: value }),

  clearList: () => set({ items: [], isEphemeral: false }),
}));
