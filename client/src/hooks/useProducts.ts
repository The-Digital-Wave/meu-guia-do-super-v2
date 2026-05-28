import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { ProductPage } from "@/types";

export function useProductSearch(q: string, enabled = true) {
  return useQuery<ProductPage>({
    queryKey: ["products", "search", q],
    queryFn: async () => {
      const { data } = await api.get<ProductPage>("/products", {
        params: { q, size: 20 },
      });
      return data;
    },
    enabled: enabled && q.trim().length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}
