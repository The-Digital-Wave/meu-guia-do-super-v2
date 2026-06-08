import { useQuery } from "@tanstack/react-query";
import { getSupermarkets } from "@/services/api";
import type { Supermarket } from "@/types";

export function useSupermarkets() {
  return useQuery<Supermarket[]>({
    queryKey: ["supermarkets"],
    queryFn: getSupermarkets,
    staleTime: 1000 * 60 * 10,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  });
}
