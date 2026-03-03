"use client";

import { useRouter } from "next/navigation";
import { Database, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { R2BucketManager } from "@/components/dashboard/r2/R2BucketManager";

interface BucketRow {
  name: string;
  creation_date: string;
}

interface BucketStats {
  objectCount: number;
  totalSizeBytes: number;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function R2ManagerClient() {
  const router = useRouter();
  const [buckets, setBuckets] = useState<BucketRow[]>([]);
  const [stats, setStats] = useState<Record<string, BucketStats>>({});
  const [loading, setLoading] = useState(true);

  const loadBuckets = useCallback(() => {
    setLoading(true);
    fetch("/api/dashboard/r2/buckets")
      .then((res) => res.json())
      .then((data: { buckets?: BucketRow[] }) => {
        const list = Array.isArray(data.buckets) ? data.buckets : [];
        setBuckets(list);
        setStats({});
        list.forEach((b: BucketRow) => {
          fetch(`/api/dashboard/r2/buckets/${encodeURIComponent(b.name)}/stats`)
            .then((r) => r.json())
            .then((s: BucketStats | { error?: string }) => {
              if (!("error" in s) && "objectCount" in s) {
                setStats((prev) => ({
                  ...prev,
                  [b.name]: {
                    objectCount: s.objectCount,
                    totalSizeBytes: s.totalSizeBytes,
                  },
                }));
              }
            })
            .catch(() => {});
        });
      })
      .catch(() => setBuckets([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadBuckets();
  }, [loadBuckets]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Quản lý R2
        </h1>
        <p className="text-sm text-muted-foreground">
          Bấm vào một hàng bucket để vào quản lý file (cây thư mục, upload, xóa,
          di chuyển).
        </p>
      </div>

      <div className="shrink-0">
        <R2BucketManager onBucketsChange={loadBuckets} />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Database className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Toàn bộ bucket
          </h2>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Đang tải danh sách bucket...
          </div>
        ) : buckets.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            Chưa có bucket nào. Tạo bucket mới ở trên.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Bucket
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Ngày tạo
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-foreground">
                    Số object
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-foreground">
                    Dung lượng
                  </th>
                </tr>
              </thead>
              <tbody>
                {buckets.map((b: BucketRow) => {
                  const s = stats[b.name];
                  const href = `/dashboard/admin/r2/${encodeURIComponent(b.name)}`;
                  return (
                    <tr
                      key={b.name}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(href)}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(href);
                        }
                      }}
                      className="cursor-pointer border-b border-border last:border-b-0 hover:bg-accent focus:bg-accent focus:outline-none"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {b.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {b.creation_date
                          ? new Date(b.creation_date).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {s !== undefined
                          ? s.objectCount.toLocaleString("vi-VN")
                          : "…"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {s !== undefined
                          ? formatSize(s.totalSizeBytes)
                          : "…"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
