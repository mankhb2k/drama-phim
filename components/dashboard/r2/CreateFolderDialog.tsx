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

const FOLDER_NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateFolderName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return "Vui lòng nhập tên thư mục.";
  if (/[\s]/.test(trimmed)) return "Tên thư mục không được chứa dấu cách.";
  if (/[^a-z0-9-]/.test(trimmed)) return "Chỉ dùng chữ thường, số và dấu gạch ngang (-).";
  if (trimmed.startsWith("-")) return "Tên không được bắt đầu bằng dấu gạch ngang.";
  if (trimmed.endsWith("-")) return "Tên không được kết thúc bằng dấu gạch ngang.";
  if (!FOLDER_NAME_REGEX.test(trimmed)) return "Định dạng không hợp lệ (ví dụ: tap-1, phim-moi).";
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

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
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

  const error = touched ? validateFolderName(value) : null;
  const normalized = value.trim() === "" ? "" : normalizeInput(value);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setTouched(true);
      const err = validateFolderName(value);
      if (err) return;
      const name = normalizeInput(value);
      if (!name) return;
      onSubmit(name);
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
            Chữ thường, số và dấu gạch ngang (-). Không dấu cách, không ký tự đặc biệt, không kết thúc bằng &quot;-&quot;.
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
              placeholder="vd: tap-1 hoặc phim-moi"
              autoComplete="off"
              disabled={isLoading}
            />
            {error && (
              <p className="mt-1 text-xs text-destructive">{error}</p>
            )}
            {value.trim() !== "" && normalized !== value.trim() && !error && (
              <p className="mt-1 text-xs text-muted-foreground">
                Sẽ dùng: <span className="font-medium text-foreground">{normalized || "(trống)"}</span>
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
              disabled={!!error || !normalized || isLoading}
            >
              {isLoading ? "Đang tạo…" : "Tạo thư mục"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
