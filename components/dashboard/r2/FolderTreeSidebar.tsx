"use client";

import { ChevronRight, FolderTree } from "lucide-react";
import { cn } from "@/lib/utils";
import { useR2ManagerStore, R2FolderItem } from "@/lib/stores/r2-manager-store";

interface FolderTreeSidebarProps {
  rootLabel?: string;
}

export function FolderTreeSidebar({ rootLabel = "videos" }: FolderTreeSidebarProps) {
  const currentPrefix = useR2ManagerStore((state) => state.currentPrefix);
  const folders = useR2ManagerStore((state) => state.folders);
  const setPrefix = useR2ManagerStore((state) => state.setPrefix);

  const handleClickRoot = () => {
    setPrefix("videos/");
  };

  const handleClickFolder = (folder: R2FolderItem) => {
    setPrefix(folder.prefix);
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <FolderTree className="size-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Cấu trúc R2
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 text-sm">
        <button
          type="button"
          onClick={handleClickRoot}
          className={cn(
            "flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-foreground hover:bg-accent",
            currentPrefix === "videos/" && "bg-accent text-foreground",
          )}
        >
          <ChevronRight className="size-3 text-muted-foreground" />
          <span className="font-medium">{rootLabel}</span>
        </button>
        <div className="mt-1 space-y-0.5 pl-4">
          {folders.map((folder: R2FolderItem) => (
            <button
              key={folder.prefix}
              type="button"
              onClick={() => handleClickFolder(folder)}
              className={cn(
                "flex w-full items-center gap-1 rounded px-2 py-1.5 text-left hover:bg-accent",
                currentPrefix === folder.prefix && "bg-accent text-foreground",
              )}
            >
              <ChevronRight className="size-3 text-muted-foreground" />
              <span>{folder.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

