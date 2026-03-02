"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCcw, Search } from "lucide-react";
import { useR2ManagerStore } from "@/lib/stores/r2-manager-store";

interface R2ActionsToolbarProps {
  onCreateFolder: () => void;
  onRefresh: () => void;
  onOpenUploadGuide: () => void;
}

export function R2ActionsToolbar({
  onCreateFolder,
  onRefresh,
  onOpenUploadGuide,
}: R2ActionsToolbarProps) {
  const [localSearch, setLocalSearch] = useState("");
  const search = useR2ManagerStore((state) => state.search);
  const setSearch = useR2ManagerStore((state) => state.setSearch);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(localSearch);
    }, 400);
    return () => clearTimeout(id);
  }, [localSearch, setSearch]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-3 py-2">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-8 w-full rounded border border-border bg-background pl-7 pr-2 text-xs outline-none ring-0 placeholder:text-muted-foreground focus:border-primary"
            placeholder="Tìm theo tên file trong thư mục hiện tại..."
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
        >
          <RefreshCcw className="size-3" />
          Tải lại
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCreateFolder}
          className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-accent"
        >
          <Plus className="size-3" />
          Thư mục
        </button>
        <button
          type="button"
          onClick={onOpenUploadGuide}
          className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Upload video R2
        </button>
      </div>
    </div>
  );
}

