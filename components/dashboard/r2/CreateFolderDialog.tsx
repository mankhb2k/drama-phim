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

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (displayName: string) => void;
  isLoading?: boolean;
}

export function CreateFolderDialog({
  open,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateFolderDialogProps) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const error = touched ? validateFolderDisplayName(value) : null;
  const segment = value.trim() === "" ? "" : toPrefixSegment(value);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setTouched(true);
      const err = validateFolderDisplayName(value);
      if (err) return;
      const displayName = value.trim();
      if (!displayName) return;
      onSubmit(displayName);
      setValue("");
      setTouched(false);
    },
    [value, onSubmit],
  );

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setValue("");
      setTouched(false);
      onClose();
    }
  }, [isLoading, onClose]);

  useEffect(() => {
    if (!open) return;
    setValue("");
    setTouched(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-sm" showClose={!isLoading}>
        <DialogHeader>
          <DialogTitle>Tạo thư mục mới</DialogTitle>
          <DialogDescription>
            Bạn có thể nhập tiếng Việt có dấu. Hệ thống sẽ tự tạo prefix dạng slug không dấu để lưu trên R2.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="create-folder-name">Tên thư mục</Label>
            <Input
              id="create-folder-name"
              type="text"
              value={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue(e.target.value)
              }
              onBlur={() => setTouched(true)}
              placeholder="VD: Phim mới 2026"
              autoComplete="off"
              disabled={isLoading}
            />
            {error && (
              <p className="mt-1 text-xs text-destructive">{error}</p>
            )}
            {value.trim() !== "" && segment && !error && (
              <p className="mt-1 text-xs text-muted-foreground">
                Prefix segment:{" "}
                <span className="font-medium text-foreground">
                  {segment}
                </span>
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
              {isLoading ? "Đang tạo…" : "Tạo thư mục"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
