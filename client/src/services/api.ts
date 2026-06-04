import axios from "axios";
import { storage } from "@/services/storage";
import type { Supermarket, Layout } from "@/types";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://meu-guia-do-super-api-v2.onrender.com/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
});

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear tokens and let the auth store handle redirect
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.deleteItem("access_token");
      await storage.deleteItem("refresh_token");
    }
    return Promise.reject(error);
  }
);

export async function getSupermarkets(): Promise<Supermarket[]> {
  const { data } = await api.get<Supermarket[]>("/supermarkets");
  return data;
}

export async function getLayoutsByStore(supermarketId: string): Promise<Layout[]> {
  const { data } = await api.get<Layout[]>("/layouts", {
    params: { supermarket_id: supermarketId },
  });
  return data;
}
