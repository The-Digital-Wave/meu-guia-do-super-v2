import axios from "axios";

import type { AdminSession, OptimizedRoute, PreviewRoute, Product, Supermarket } from "../types/domain";

function resolveApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();
  if (!configuredUrl) {
    return "http://localhost:4000/api";
  }

  const withoutTrailingSlash = configuredUrl.replace(/\/+$/, "");
  if (withoutTrailingSlash.endsWith("/api")) {
    return withoutTrailingSlash;
  }

  return `${withoutTrailingSlash}/api`;
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
});

export async function fetchSupermarkets(query = "") {
  const response = await api.get<Supermarket[]>("/supermarkets", { params: { q: query } });
  return response.data;
}

export async function fetchSupermarket(id: string) {
  const response = await api.get<Supermarket>(`/supermarkets/${id}`);
  return response.data;
}

export async function searchProducts(supermarketId: string, query: string) {
  const response = await api.get<Product[]>("/products", {
    params: {
      supermarketId,
      q: query,
    },
  });
  return response.data;
}

export async function previewProductRoute(payload: { supermarketId: string; productId: string; start: { x: number; y: number } }) {
  const response = await api.post<PreviewRoute>("/navigation/preview", payload);
  return response.data;
}

export async function optimizeGroceryRoute(payload: { supermarketId: string; productIds: string[]; start: { x: number; y: number } }) {
  const response = await api.post<OptimizedRoute>("/navigation/optimize", payload);
  return response.data;
}

export async function submitContact(payload: { name: string; email: string; message: string }) {
  const response = await api.post("/contact", payload);
  return response.data;
}

export async function loginAdmin(payload: { email: string; password: string }) {
  const response = await api.post<AdminSession>("/auth/login", payload);
  return response.data;
}

export async function createShelf(payload: {
  layoutId: string;
  name: string;
  sectionName: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  racks: number;
  sections: number;
}) {
  const response = await api.post("/shelves", payload);
  return response.data;
}

export async function updateShelf(id: string, payload: Record<string, unknown>) {
  const response = await api.put(`/shelves/${id}`, payload);
  return response.data;
}

export async function createProduct(payload: {
  name: string;
  brand?: string;
  description?: string;
  category?: string;
  shelfId: string;
  sectionIndex: number;
  quantity: number;
}) {
  const response = await api.post("/products", payload);
  return response.data;
}

export async function downloadLayout(id: string) {
  const response = await api.get(`/layouts/${id}`);
  return response.data;
}
