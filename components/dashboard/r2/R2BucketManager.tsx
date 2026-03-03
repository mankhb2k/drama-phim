"use client";

import { useState } from "react";
import { Database, Loader2, Plus } from "lucide-react";

interface R2BucketManagerProps {
  onBucketsChange?: () => void;
}

export function R2BucketManager({ onBucketsChange }: R2BucketManagerProps) {
  const [createLoading, setCreateLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (name.length < 3) {
      setCreateError("Tên bucket tối thiểu 3 ký tự (chữ thường, số, gạch ngang)");
      return;
    }
    if (name.length > 63) {
      setCreateError("Tên bucket tối đa 63 ký tự");
      return;
    }
    if (/^-|-$/.test(name)) {
      setCreateError("Tên bucket không được bắt đầu hoặc kết thúc bằng gạch ngang");
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/dashboard/r2/buckets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? "Không thể tạo bucket");
        return;
      }
      setNewName("");
      onBucketsChange?.();
    } catch {
      setCreateError("Lỗi khi tạo bucket");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Database className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">
          Quản lý bucket R2
        </h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Tạo bucket mới qua Cloudflare API (cần CLOUDFLARE_API_TOKEN và
        R2_ACCOUNT_ID trong .env, chỉ Admin). Chọn bucket trong sidebar trái để
        xem cấu trúc file.
      </p>

      <form onSubmit={handleCreate} className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-1 min-w-[160px] flex-col gap-1">
          <span className="text-xs font-medium text-foreground">
            Tên bucket mới
          </span>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="vd: video-backup"
            className="rounded border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
            disabled={createLoading}
          />
        </label>
        <button
          type="submit"
          disabled={createLoading}
          className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {createLoading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Plus className="size-3" />
          )}
          Tạo bucket
        </button>
      </form>
      {createError && (
        <p className="text-xs text-destructive">{createError}</p>
      )}
    </div>
  );
}
