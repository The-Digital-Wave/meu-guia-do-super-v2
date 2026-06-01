import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { GroceryList, GroceryItem } from "@/types";

export function useGroceryLists(options?: { enabled?: boolean }) {
  return useQuery<GroceryList[]>({
    queryKey: ["grocery-lists"],
    queryFn: async () => {
      const { data } = await api.get<GroceryList[]>("/grocery-lists");
      return data;
    },
    enabled: options?.enabled !== false,
  });
}

export function useGroceryList(listId: string | null) {
  return useQuery<GroceryList>({
    queryKey: ["grocery-list", listId],
    queryFn: async () => {
      const { data } = await api.get<GroceryList>(`/grocery-lists/${listId}`);
      return data;
    },
    enabled: !!listId,
  });
}

export function useCreateGroceryList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (layoutId?: string) => {
      const { data } = await api.post<GroceryList>("/grocery-lists", {
        layout_id: layoutId ?? null,
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grocery-lists"] }),
  });
}

export function useAddGroceryItem(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: { product_id: string; product_name_snapshot: string }) => {
      const { data } = await api.post<GroceryItem>(
        `/grocery-lists/${listId}/items`,
        product
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grocery-list", listId] }),
  });
}

export function useRemoveGroceryItem(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/grocery-lists/${listId}/items/${itemId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grocery-list", listId] }),
  });
}

export function useUpdateGroceryItem(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, checked, sort_order }: { itemId: string; checked?: boolean; sort_order?: number }) => {
      const { data } = await api.put(`/grocery-lists/${listId}/items/${itemId}`, { checked, sort_order });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grocery-list", listId] }),
  });
}

export function useOptimizeGroceryList(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<GroceryItem[]>(
        `/grocery-lists/${listId}/optimize`
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grocery-list", listId] }),
  });
}
