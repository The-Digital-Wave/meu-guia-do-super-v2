import { create } from "zustand";

interface GroceryItem {
  id: string;
  product_id: string;
  product_name_snapshot: string;
  sort_order: number;
  checked: boolean;
}

interface GroceryList {
  id: string;
  layout_id: string | null;
  items: GroceryItem[];
}

interface GroceryListState {
  currentList: GroceryList | null;
  setCurrentList: (list: GroceryList) => void;
  updateItems: (items: GroceryItem[]) => void;
  toggleItem: (itemId: string) => void;
  clearList: () => void;
}

export const useGroceryListStore = create<GroceryListState>((set) => ({
  currentList: null,

  setCurrentList: (list) => set({ currentList: list }),

  updateItems: (items) =>
    set((state) => ({
      currentList: state.currentList
        ? { ...state.currentList, items }
        : null,
    })),

  toggleItem: (itemId) =>
    set((state) => ({
      currentList: state.currentList
        ? {
            ...state.currentList,
            items: state.currentList.items.map((item) =>
              item.id === itemId ? { ...item, checked: !item.checked } : item
            ),
          }
        : null,
    })),

  clearList: () => set({ currentList: null }),
}));
