import { create } from "zustand";

export type ToastItem = {
  id: string;
  type: "success" | "error";
  text: string;
  createdAt: number;
};

type ToastState = {
  toasts: ToastItem[];
  addToast: (type: "success" | "error", text: string) => void;
  removeToast: (id: string) => void;
};

let toastId = 0;
const TOAST_TTL_MS = 5000;

function nextId() {
  toastId += 1;
  return `toast-${toastId}`;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (type: "success" | "error", text: string) => {
    const id = nextId();
    const createdAt = Date.now();
    set((state) => ({
      toasts: [...state.toasts, { id, type, text, createdAt }],
    }));
    setTimeout(() => {
      get().removeToast(id);
    }, TOAST_TTL_MS);
  },
  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t: ToastItem) => t.id !== id),
    }));
  },
}));
