"use client";

import type { R2FolderItem } from "@/lib/stores/r2-manager-store";

interface DeleteFolderConfirmProps {
  open: boolean;
  folder: R2FolderItem | null;
  onClose: () => void;
  onConfirm: (folder: R2FolderItem) => void;
  isLoading?: boolean;
}

export function DeleteFolderConfirm({
  open,
  folder,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteFolderConfirmProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-folder-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-lg"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <h2 id="delete-folder-title" className="mb-2 text-lg font-semibold text-foreground">
          Xóa folder
        </h2>
        {folder && (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              Bạn có chắc muốn xóa folder <span className="font-medium text-foreground">{folder.name}</span> và toàn bộ nội dung bên trong?
            </p>
            <p className="mb-4 font-mono text-xs text-muted-foreground">{folder.prefix}</p>
          </>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => folder && onConfirm(folder)}
            disabled={!folder || isLoading}
            className="rounded-lg bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {isLoading ? "Đang xóa…" : "Xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}
