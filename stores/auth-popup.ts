import { create } from "zustand";

export type AuthPopupTab = "login" | "register";

interface AuthPopupStore {
  isOpen: boolean;
  tab: AuthPopupTab;
  open: (tab?: AuthPopupTab) => void;
  close: () => void;
}

export const useAuthPopupStore = create<AuthPopupStore>((set) => ({
  isOpen: false,
  tab: "login",
  open: (tab = "login") => set({ isOpen: true, tab }),
  close: () => set({ isOpen: false }),
}));
