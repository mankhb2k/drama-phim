"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
} from "@/components/ui";
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

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md" showClose={!isLoading}>
        <DialogHeader>
          <DialogTitle>Di chuyển folder</DialogTitle>
          {folder && (
            <DialogDescription>
              Folder: <span className="font-mono text-foreground">{folder.prefix}</span>
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="move-folder-dest">
              Đường dẫn đích (prefix)
            </Label>
            <Input
              id="move-folder-dest"
              type="text"
              value={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder="vd: videos/nsh hoặc phim-moi/tap-1"
              autoComplete="off"
              disabled={isLoading}
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang di chuyển…" : "Di chuyển"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
