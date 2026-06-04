import { create } from "zustand";
import { storage } from "@/services/storage";
import { api } from "@/services/api";

interface User {
  id: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  loginAsGuest: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  isGuest: false,

  loginAsGuest: () => set({ isGuest: true, user: null, isAuthenticated: false }),

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);
      const { data } = await api.post("/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      await storage.setItem("access_token", data.access_token);
      await storage.setItem("refresh_token", data.refresh_token);
      const { data: me } = await api.get("/users/me");
      set({ user: me, isAuthenticated: true, isGuest: false });
    } catch (e) {
      // Clean up any partially-written tokens
      await storage.deleteItem("access_token");
      await storage.deleteItem("refresh_token");
      throw e; // re-throw so the UI can show the error
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, password) => {
    set({ isLoading: true });
    try {
      await api.post("/auth/register", { email, password });
      // Auto-login after register
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);
      const { data } = await api.post("/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      await storage.setItem("access_token", data.access_token);
      await storage.setItem("refresh_token", data.refresh_token);
      const { data: me } = await api.get("/users/me");
      set({ user: me, isAuthenticated: true });
    } catch (e) {
      // Clean up any partially-written tokens
      await storage.deleteItem("access_token");
      await storage.deleteItem("refresh_token");
      throw e; // re-throw so the UI can show the error
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await storage.deleteItem("access_token");
    await storage.deleteItem("refresh_token");
    set({ user: null, isAuthenticated: false, isGuest: false });
  },

  restoreSession: async () => {
    // Guard against concurrent invocations (StrictMode double-mount)
    const { isLoading } = useAuthStore.getState();
    if (isLoading) return;
    set({ isLoading: true });
    const token = await storage.getItem("access_token");
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { data: me } = await api.get("/users/me");
      set({ user: me, isAuthenticated: true });
    } catch {
      await storage.deleteItem("access_token");
      await storage.deleteItem("refresh_token");
    } finally {
      set({ isLoading: false });
    }
  },
}));
