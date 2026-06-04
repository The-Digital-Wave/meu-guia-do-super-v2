import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Layout, LayoutBundle } from "@/types";

export function useLayouts(supermarketId?: string | null) {
  return useQuery<Layout[]>({
    queryKey: ["layouts", supermarketId],
    queryFn: async () => {
      const params = supermarketId ? { supermarket_id: supermarketId } : {};
      const { data } = await api.get<Layout[]>("/layouts", { params });
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useLayoutBundle(layoutId: string | null) {
  return useQuery<LayoutBundle>({
    queryKey: ["layout-bundle", layoutId],
    queryFn: async () => {
      const { data } = await api.get<LayoutBundle>(`/layouts/${layoutId}/download`);
      return data;
    },
    enabled: !!layoutId,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
}
