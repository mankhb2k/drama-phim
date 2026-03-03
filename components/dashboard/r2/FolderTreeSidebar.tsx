"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, FolderTree } from "lucide-react";
import { cn } from "@/lib/utils";
import { useR2ManagerStore, R2FolderItem } from "@/lib/stores/r2-manager-store";

interface FolderTreeSidebarProps {
  /** Nhãn cho nút gốc bucket (prefix rỗng), mặc định "Gốc". Có thể truyền tên bucket. */
  rootLabel?: string;
  /** Tên bucket để build slug điều hướng (vd. /dashboard/admin/r2/{bucket}/videos/nsh). */
  bucketSlug?: string;
  /** Gọi khi click chuột phải vào một folder (để hiện context menu). */
  onFolderContextMenu?: (folder: R2FolderItem, e: React.MouseEvent) => void;
}

export function FolderTreeSidebar({
  rootLabel = "Gốc",
  bucketSlug = "",
  onFolderContextMenu,
}: FolderTreeSidebarProps) {
  const currentPrefix = useR2ManagerStore((state) => state.currentPrefix);
  const folders = useR2ManagerStore((state) => state.folders);

  const baseHref =
    bucketSlug !== ""
      ? `/dashboard/admin/r2/${encodeURIComponent(bucketSlug)}`
      : null;

  const folderHref = (folder: R2FolderItem): string => {
    if (!baseHref) return "#";
    const path = folder.prefix.replace(/\/+$/, "");
    if (!path) return baseHref;
    return `${baseHref}/${path.split("/").map(encodeURIComponent).join("/")}`;
  };

  const isAtRoot = currentPrefix === "";
  const currentFolderName = isAtRoot
    ? null
    : currentPrefix.replace(/\/+$/, "").split("/").pop() ?? null;

  /** Chỉ hiển thị folder con trực tiếp của prefix hiện tại (khi vào subtitle/ chỉ hiện con của subtitle, không hiện folder gốc bucket). */
  const directChildFolders = folders.filter((folder: R2FolderItem) => {
    if (!folder.prefix.startsWith(currentPrefix)) return false;
    const after = folder.prefix.slice(currentPrefix.length).replace(/\/+$/, "");
    return after !== "" && !after.includes("/");
  });

  const parentHref = ((): string | null => {
    if (!baseHref || isAtRoot) return null;
    const segments = currentPrefix.replace(/\/+$/, "").split("/").filter(Boolean);
    if (segments.length <= 1) return baseHref;
    const parentPath = segments.slice(0, -1).map(encodeURIComponent).join("/");
    return `${baseHref}/${parentPath}`;
  })();

  /** Nhãn nút back: khi có thư mục cha thì hiển thị tên folder cha (vd. "video"), khi ở cấp 1 thì hiển thị tên bucket. */
  const parentBackLabel =
    parentHref && !isAtRoot
      ? (() => {
          const segments = currentPrefix.replace(/\/+$/, "").split("/").filter(Boolean);
          if (segments.length <= 1) return rootLabel;
          return segments[segments.length - 2] ?? rootLabel;
        })()
      : rootLabel;

  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <FolderTree className="size-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Cấu trúc R2
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 text-sm">
        <div>
          {isAtRoot ? (
            baseHref ? (
              <Link
                href={baseHref}
                className={cn(
                  "flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-foreground hover:bg-accent",
                  "bg-accent text-foreground",
                )}
              >
                <ChevronRight className="size-3 text-muted-foreground" />
                <span className="font-medium">{rootLabel}</span>
              </Link>
            ) : (
              <span className="flex w-full items-center gap-1 rounded px-2 py-1.5 text-left font-medium text-foreground">
                <ChevronRight className="size-3 text-muted-foreground" />
                {rootLabel}
              </span>
            )
          ) : (
            <>
              {parentHref && (
                <Link
                  href={parentHref}
                  className="flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <ChevronLeft className="size-3" />
                  <span className="text-xs">{parentBackLabel}</span>
                </Link>
              )}
              <div
                className={cn(
                  "flex w-full items-center gap-1 rounded px-2 py-1.5 font-medium text-foreground",
                  "bg-accent text-foreground",
                )}
              >
                <ChevronRight className="size-3 text-muted-foreground" />
                <span>{currentFolderName ?? currentPrefix}</span>
              </div>
            </>
          )}

          {directChildFolders.length > 0 && (
            <>
              <span className="mb-1 mt-2 block px-2 text-xs font-medium text-muted-foreground">
                Thư mục
              </span>
              <div className="mt-1 space-y-0.5 pl-4">
                {directChildFolders.map((folder: R2FolderItem) => {
                  const href = folderHref(folder);
                  const isActive = currentPrefix === folder.prefix;
                  return (
                    <div
                      key={folder.prefix}
                      className="relative"
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onFolderContextMenu?.(folder, e);
                      }}
                    >
                      <Link
                        href={href}
                        className={cn(
                          "flex w-full items-center gap-1 rounded px-2 py-1.5 text-left hover:bg-accent",
                          isActive && "bg-accent text-foreground",
                        )}
                      >
                        <ChevronRight className="size-3 text-muted-foreground" />
                        <span>{folder.name}</span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

