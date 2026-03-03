"use client";

import { useCallback, useEffect, useState } from "react";
import type { R2FolderItem } from "@/lib/stores/r2-manager-store";

const FOLDER_NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateFolderName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return "Vui lòng nhập tên thư mục.";
  if (/[\s]/.test(trimmed)) return "Tên thư mục không được chứa dấu cách.";
  if (/[^a-z0-9-]/.test(trimmed)) return "Chỉ dùng chữ thường, số và dấu gạch ngang (-).";
  if (trimmed.startsWith("-")) return "Tên không được bắt đầu bằng dấu gạch ngang.";
  if (trimmed.endsWith("-")) return "Tên không được kết thúc bằng dấu gạch ngang.";
  if (!FOLDER_NAME_REGEX.test(trimmed)) return "Định dạng không hợp lệ (ví dụ: tap-1).";
  return null;
}

function normalizeInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

interface RenameFolderDialogProps {
  open: boolean;
  folder: R2FolderItem | null;
  onClose: () => void;
  onSubmit: (folder: R2FolderItem, newName: string) => void;
  isLoading?: boolean;
}

export function RenameFolderDialog({
  open,
  folder,
  onClose,
  onSubmit,
  isLoading = false,
}: RenameFolderDialogProps) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const error = touched ? validateFolderName(value) : null;
  const normalized = value.trim() === "" ? "" : normalizeInput(value);

  useEffect(() => {
    if (open && folder) {
      setValue(folder.name);
      setTouched(false);
    }
  }, [open, folder]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setTouched(true);
      const err = validateFolderName(value);
      if (err || !folder) return;
      const name = normalizeInput(value);
      if (!name) return;
      onSubmit(folder, name);
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
      aria-labelledby="rename-folder-title"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-lg"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <h2 id="rename-folder-title" className="mb-3 text-lg font-semibold text-foreground">
          Đổi tên folder
        </h2>
        {folder && (
          <p className="mb-3 text-xs text-muted-foreground">
            Đường dẫn hiện tại: <span className="font-mono text-foreground">{folder.prefix}</span>
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label htmlFor="rename-folder-name" className="mb-1 block text-sm font-medium text-foreground">
              Tên mới
            </label>
            <input
              id="rename-folder-name"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="vd: tap-1"
              autoComplete="off"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
              disabled={isLoading}
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            {value.trim() !== "" && normalized !== value.trim() && !error && (
              <p className="mt-1 text-xs text-muted-foreground">
                Sẽ dùng: <span className="font-medium text-foreground">{normalized || "(trống)"}</span>
              </p>
            )}
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
              disabled={!!error || !normalized || isLoading}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? "Đang lưu…" : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
