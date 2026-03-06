"use client";

import { useEffect, useRef } from "react";
import { FolderInput, Pencil, Trash2 } from "lucide-react";
import type { R2FolderItem } from "@/lib/stores/r2-manager-store";

interface FolderContextMenuProps {
  x: number;
  y: number;
  folder: R2FolderItem | null;
  onClose: () => void;
  onRename: (folder: R2FolderItem) => void;
  onMove: (folder: R2FolderItem) => void;
  onDelete: (folder: R2FolderItem) => void;
}

export function FolderContextMenu({
  x,
  y,
  folder,
  onClose,
  onRename,
  onMove,
  onDelete,
}: FolderContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  if (!folder) return null;

  return (
    <div
      ref={ref}
      className="fixed z-[100] min-w-[11.25rem] rounded-lg border border-border bg-card py-1 shadow-lg"
      style={{ left: x, top: y }}
      role="menu"
    >
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
        onClick={() => {
          onRename(folder);
          onClose();
        }}
      >
        <Pencil className="size-3.5 text-muted-foreground" />
        Đổi tên folder
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
        onClick={() => {
          onMove(folder);
          onClose();
        }}
      >
        <FolderInput className="size-3.5 text-muted-foreground" />
        Di chuyển folder
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
        onClick={() => {
          onDelete(folder);
          onClose();
        }}
      >
        <Trash2 className="size-3.5" />
        Xóa folder
      </button>
    </div>
  );
}
