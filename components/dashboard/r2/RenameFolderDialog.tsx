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

function toPrefixSegment(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function validateFolderDisplayName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return "Vui lòng nhập tên thư mục.";
  if (/[\\/]/.test(trimmed)) return "Tên thư mục không được chứa ký tự / hoặc \\.";
  const seg = toPrefixSegment(trimmed);
  if (!seg) return "Tên này sau khi tạo prefix sẽ bị rỗng. Hãy nhập tên khác.";
  return null;
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

  const error = touched ? validateFolderDisplayName(value) : null;
  const segment = value.trim() === "" ? "" : toPrefixSegment(value);

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
      const err = validateFolderDisplayName(value);
      if (err || !folder) return;
      const displayName = value.trim();
      if (!displayName) return;
      onSubmit(folder, displayName);
      onClose();
    },
    [value, folder, onSubmit, onClose],
  );

  const handleClose = useCallback(() => {
    if (!isLoading) onClose();
  }, [isLoading, onClose]);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-sm" showClose={!isLoading}>
        <DialogHeader>
          <DialogTitle>Đổi tên folder</DialogTitle>
          {folder && (
            <DialogDescription>
              Đường dẫn hiện tại: <span className="font-mono text-foreground">{folder.prefix}</span>
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="rename-folder-name">Tên mới</Label>
            <Input
              id="rename-folder-name"
              type="text"
              value={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue(e.target.value)
              }
              onBlur={() => setTouched(true)}
              placeholder="VD: Tập 1"
              autoComplete="off"
              disabled={isLoading}
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            {value.trim() !== "" && segment && !error && (
              <p className="mt-1 text-xs text-muted-foreground">
                Prefix segment: <span className="font-medium text-foreground">{segment}</span>
              </p>
            )}
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
            <Button
              type="submit"
              disabled={!!error || !segment || isLoading}
            >
              {isLoading ? "Đang lưu…" : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
