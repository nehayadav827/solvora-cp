import { create } from "zustand";
import axiosInstance from "../api/axiosInstance";

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  loading: true,

  setAuth: (user, accessToken) => set({ user, accessToken, loading: false }),

  clearAuth: () => set({ user: null, accessToken: null, loading: false }),

  // Called once when the app loads — checks if user already has a session
  fetchMe: async () => {
    try {
      const res = await axiosInstance.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
      });
      set({ user: res.data.user, loading: false });
    } catch {
      set({ user: null, accessToken: null, loading: false });
    }
  },
}));