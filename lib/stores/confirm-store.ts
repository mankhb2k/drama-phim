import { create } from "zustand";

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  onConfirm: (() => void) | null;
  openConfirm: (params: {
    title: string;
    description: string;
    onConfirm: () => void;
  }) => void;
  closeConfirm: () => void;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  open: false,
  title: "",
  description: "",
  onConfirm: null,
  openConfirm: ({ title, description, onConfirm }) =>
    set({ open: true, title, description, onConfirm }),
  closeConfirm: () =>
    set({ open: false, title: "", description: "", onConfirm: null }),
}));
