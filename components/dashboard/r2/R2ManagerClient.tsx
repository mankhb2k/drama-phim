"use client";

import Link from "next/link";
import { Info, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useR2ManagerStore } from "@/lib/stores/r2-manager-store";
import { FolderTreeSidebar } from "@/components/dashboard/r2/FolderTreeSidebar";
import { FileTable } from "@/components/dashboard/r2/FileTable";
import { R2ActionsToolbar } from "@/components/dashboard/r2/R2ActionsToolbar";

export function R2ManagerClient() {
  const currentPrefix = useR2ManagerStore((state) => state.currentPrefix);
  const search = useR2ManagerStore((state) => state.search);
  const setData = useR2ManagerStore((state) => state.setData);
  const setLoading = useR2ManagerStore((state) => state.setLoading);
  const clearSelection = useR2ManagerStore((state) => state.clearSelection);
  const selectedKeys = useR2ManagerStore((state) => state.selectedKeys);
  const isLoading = useR2ManagerStore((state) => state.isLoading);
  const [error, setError] = useState<string | null>(null);

  const loadObjects = async () => {
    try {
      setError(null);
      setLoading(true);
      clearSelection();

      const params = new URLSearchParams();
      params.set("prefix", currentPrefix);
      if (search && search.trim() !== "") {
        params.set("search", search.trim());
      }

      const res = await fetch(`/api/dashboard/r2/objects?${params.toString()}`, {
        method: "GET",
      });

      if (!res.ok) {
        throw new Error("Không thể tải danh sách object từ R2");
      }
      const json = await res.json();
      setData(json.folders ?? [], json.files ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra khi tải dữ liệu R2",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadObjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPrefix, search]);

  const handleCreateFolder = async () => {
    const name = window.prompt(
      "Tên thư mục mới (sẽ được chuẩn hoá slug, ví dụ: tap-1):",
    );
    if (!name || name.trim() === "") return;

    try {
      setError(null);
      setLoading(true);
      const res = await fetch("/api/dashboard/r2/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentPrefix: currentPrefix,
          name: name.trim(),
        }),
      });
      if (!res.ok) {
        throw new Error("Không thể tạo thư mục mới");
      }
      await loadObjects();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra khi tạo thư mục",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUploadGuide = () => {
    window.alert(
      "Upload R2: gọi /api/dashboard/r2/sign-upload để lấy URL, PUT file lên R2 rồi gọi /api/dashboard/videos/finalize để gắn vào tập phim.",
    );
  };

  const handleMoveSelected = () => {
    if (selectedKeys.length === 0) return;
    const toPrefix = window.prompt(
      "Nhập prefix thư mục đích (ví dụ: videos/nsh/slug-phim/tap-1/):",
      currentPrefix,
    );
    if (!toPrefix || toPrefix.trim() === "") return;

    const trimmedPrefix = toPrefix.trim();

    const run = async () => {
      try {
        setError(null);
        setLoading(true);
        for (const key of selectedKeys) {
          const res = await fetch("/api/dashboard/r2/move", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fromKey: key,
              toPrefix: trimmedPrefix,
            }),
          });
          if (!res.ok) {
            throw new Error("Không thể di chuyển một số file");
          }
        }
        await loadObjects();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Có lỗi xảy ra khi di chuyển file",
        );
      } finally {
        setLoading(false);
      }
    };

    void run();
  };

  const handleDeleteSelected = () => {
    // TODO: xác nhận và gọi API xoá từng file (hoặc thêm route batch nếu cần)
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Quản lý R2
        </h1>
        <p className="text-sm text-muted-foreground">
          Quản lý video lưu trữ trên Cloudflare R2 theo cấu trúc thư mục để dễ
          tìm kiếm và chỉnh sửa.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <div className="hidden w-64 shrink-0 md:block">
          <FolderTreeSidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <R2ActionsToolbar
            onCreateFolder={handleCreateFolder}
            onRefresh={loadObjects}
            onOpenUploadGuide={handleOpenUploadGuide}
          />

          <div className="flex-1 overflow-y-auto p-4">
            {error && (
              <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Đang tải danh sách object từ R2...
              </div>
            ) : (
              <FileTable
                onMoveSelected={handleMoveSelected}
                onDeleteSelected={handleDeleteSelected}
              />
            )}

            <div className="mt-4 rounded-md border border-border bg-card p-3 text-xs text-muted-foreground">
              <div className="mb-1 flex items-center gap-2">
                <Info className="size-3" />
                <span className="font-medium text-foreground">
                  Flow upload R2 hiện tại
                </span>
              </div>
              <p>
                Upload sử dụng API{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                  /api/dashboard/r2/sign-upload
                </code>{" "}
                để lấy URL upload và{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                  /api/dashboard/videos/finalize
                </code>{" "}
                để tạo server gắn với tập phim.
              </p>
              <p className="mt-1">
                Bạn cũng có thể điều hướng sang{" "}
                <Link
                  href="/dashboard/admin/movies"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  danh sách phim
                </Link>{" "}
                để cấu hình server R2 cho từng tập.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

