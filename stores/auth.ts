import { create } from "zustand";

export interface AuthUser {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
}

interface AuthStore {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
