"use client";

import { useCallback, useEffect, useState } from "react";
import type { R2FolderItem } from "@/lib/stores/r2-manager-store";

interface MoveFolderDialogProps {
  open: boolean;
  folder: R2FolderItem | null;
  onClose: () => void;
  onSubmit: (folder: R2FolderItem, toPrefix: string) => void;
  isLoading?: boolean;
}

function normalizePrefix(input: string): string {
  return input
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/+/g, "/");
}

export function MoveFolderDialog({
  open,
  folder,
  onClose,
  onSubmit,
  isLoading = false,
}: MoveFolderDialogProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && folder) {
      const parent = folder.prefix.replace(/\/+$/, "").split("/").slice(0, -1).join("/");
      setValue(parent);
      setError(null);
    }
  }, [open, folder]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!folder) return;
      const normalized = normalizePrefix(value);
      if (!normalized) {
        setError("Nhập đường dẫn thư mục đích (vd: videos/nsh).");
        return;
      }
      const toPrefix = normalized + "/" + folder.name + "/";
      if (toPrefix === folder.prefix) {
        setError("Đường dẫn đích trùng với vị trí hiện tại.");
        return;
      }
      if (folder.prefix.startsWith(toPrefix)) {
        setError("Không thể di chuyển folder vào chính nó hoặc folder con.");
        return;
      }
      setError(null);
      onSubmit(folder, toPrefix);
      onClose();
    },
    [value, folder, onSubmit, onClose],
  );

  const handleClose = useCallback(() => {
    if (!isLoading) onClose();
  }, [isLoading, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="move-folder-title"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <h2 id="move-folder-title" className="mb-3 text-lg font-semibold text-foreground">
          Di chuyển folder
        </h2>
        {folder && (
          <p className="mb-3 text-xs text-muted-foreground">
            Folder: <span className="font-mono text-foreground">{folder.prefix}</span>
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label htmlFor="move-folder-dest" className="mb-1 block text-sm font-medium text-foreground">
              Đường dẫn đích (prefix)
            </label>
            <input
              id="move-folder-dest"
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder="vd: videos/nsh hoặc phim-moi/tap-1"
              autoComplete="off"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
              disabled={isLoading}
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? "Đang di chuyển…" : "Di chuyển"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
