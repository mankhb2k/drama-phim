"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRightSquare, Check, MoveRight, Pencil, Trash2, X } from "lucide-react";
import { naturalCompare } from "@/lib/utils";
import { Input, Checkbox } from "@/components/ui";
import { useR2ManagerStore, R2FileItem } from "@/lib/stores/r2-manager-store";

/** Giữ nguyên đuôi file: nếu original có đuôi (vd. .mp4) thì newName phải kết thúc bằng đuôi đó. */
function ensureExtension(newName: string, originalName: string): string {
  const trimmed = newName.trim();
  if (!trimmed) return originalName;
  const lastDot = originalName.lastIndexOf(".");
  if (lastDot <= 0) return trimmed;
  const ext = originalName.slice(lastDot);
  return trimmed.endsWith(ext) ? trimmed : trimmed + ext;
}

interface FileTableProps {
  onMoveSelected: () => void;
  onRenameSubmit: (fromKey: string, newName: string) => void;
  onDeleteSelected: () => void;
}

export function FileTable({
  onMoveSelected,
  onRenameSubmit,
  onDeleteSelected,
}: FileTableProps) {
  const files = useR2ManagerStore((state) => state.files);
  const selectedKeys = useR2ManagerStore((state) => state.selectedKeys);
  const toggleSelect = useR2ManagerStore((state) => state.toggleSelect);
  const clearSelection = useR2ManagerStore((state) => state.clearSelection);
  const selectAllFiles = useR2ManagerStore((state) => state.selectAllFiles);
  const sortByName = useR2ManagerStore((state) => state.sortByName);

  const [renamingKey, setRenamingKey] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const displayFiles = useMemo(() => {
    const list = [...files];
    if (sortByName === "a-z") {
      list.sort((a: R2FileItem, b: R2FileItem) => naturalCompare(a.name, b.name));
    }
    return list;
  }, [files, sortByName]);

  const hasSelection = selectedKeys.length > 0;
  const hasSingleSelection = selectedKeys.length === 1;
  const allSelected =
    displayFiles.length > 0 && selectedKeys.length === displayFiles.length;

  useEffect(() => {
    if (renamingKey) {
      setRenameValue(() => {
        const f = files.find((x: R2FileItem) => x.key === renamingKey);
        return f?.name ?? "";
      });
      renameInputRef.current?.focus();
    }
  }, [renamingKey, files]);

  const handleToggle = (key: string) => {
    toggleSelect(key);
  };

  const handleStartRename = () => {
    if (hasSingleSelection) setRenamingKey(selectedKeys[0]);
  };

  const handleRenameConfirm = (file: R2FileItem) => {
    const newName = ensureExtension(renameValue, file.name);
    if (newName === file.name) {
      setRenamingKey(null);
      return;
    }
    onRenameSubmit(file.key, newName);
    setRenamingKey(null);
  };

  const handleRenameCancel = () => {
    setRenamingKey(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {displayFiles.length} file
            {selectedKeys.length > 0 ? ` • ${selectedKeys.length} đang chọn` : ""}
          </span>
          {displayFiles.length > 0 && (
            <button
              type="button"
              className="rounded border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
              onClick={() => (allSelected ? clearSelection() : selectAllFiles())}
            >
              {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onMoveSelected}
            disabled={!hasSelection}
          >
            <MoveRight className="size-3" />
            Di chuyển
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleStartRename}
            disabled={!hasSingleSelection}
            title="Chọn đúng 1 file để đổi tên (đuôi file giữ nguyên)"
          >
            <Pencil className="size-3" />
            Đổi tên
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded border border-destructive bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onDeleteSelected}
            disabled={!hasSelection}
          >
            <Trash2 className="size-3" />
            Xoá
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">
                <span className="sr-only">Select</span>
              </th>
              <th className="px-3 py-2">Tên file</th>
              <th className="px-3 py-2">Dung lượng</th>
              <th className="px-3 py-2">Cập nhật</th>
              <th className="px-3 py-2">Xem</th>
            </tr>
          </thead>
          <tbody>
            {displayFiles.map((file: R2FileItem) => {
              const checked = selectedKeys.includes(file.key);
              const sizeMb = file.size / (1024 * 1024);
              return (
                <tr
                  key={file.key}
                  className="border-b border-border/60 last:border-b-0 hover:bg-accent/40"
                >
                  <td className="px-3 py-2 align-top">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => handleToggle(file.key)}
                      className="size-3.5"
                    />
                  </td>
                  <td className="max-w-[16.25rem] px-3 py-2 align-top">
                    {renamingKey === file.key ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1">
                          <Input
                            ref={renameInputRef}
                            type="text"
                            value={renameValue}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setRenameValue(e.target.value)
                            }
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                              if (e.key === "Enter") handleRenameConfirm(file);
                              if (e.key === "Escape") handleRenameCancel();
                            }}
                            className="min-w-0 flex-1 border-primary py-1 focus-visible:ring-primary"
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameConfirm(file)}
                            className="rounded border border-primary bg-primary p-1 text-primary-foreground hover:bg-primary/90"
                            title="Lưu"
                          >
                            <Check className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleRenameCancel}
                            className="rounded border border-border p-1 text-muted-foreground hover:bg-muted"
                            title="Hủy"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Đuôi file giữ nguyên
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="truncate font-medium text-foreground">
                          {file.name}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {file.key}
                        </div>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                    {sizeMb.toFixed(2)} MB
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                    {new Date(file.lastModified).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 align-top text-xs">
                    <Link
                      href={file.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-accent"
                    >
                      <ArrowUpRightSquare className="size-3" />
                      Mở
                    </Link>
                  </td>
                </tr>
              );
            })}
            {displayFiles.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  Không có file nào trong thư mục này.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

