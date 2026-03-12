"use client";

import { useToastStore } from "@/lib/stores/toast-store";
import { CheckCircle2, X, XCircle } from "lucide-react";

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[100] flex max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-lg"
          role="alert"
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="size-5 shrink-0 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="size-5 shrink-0 text-destructive" />
          )}
          <p className="min-w-0 flex-1 text-sm font-medium text-foreground">
            {toast.text}
          </p>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Đóng"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
