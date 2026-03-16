"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, FolderOpen, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  Button,
} from "@/components/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui";

type FolderItem = { name: string; prefix: string };
type FileItem = { key: string; name: string };

function normalizePrefix(p: string): string {
  const t = p.replace(/^\/+|\/+$/g, "").trim();
  return t ? `${t}/` : "";
}

interface MoveFilesDialogProps {
  open: boolean;
  onClose: () => void;
  /** Thư mục đang đứng (nguồn). */
  sourcePrefix: string;
  /** Các key đầy đủ của file cần di chuyển. */
  selectedKeys: string[];
  bucketSlug: string;
  /** Gọi khi user xác nhận đích và (nếu có trùng) chọn ghi đè. toPrefix đã chuẩn hóa (có / cuối). */
  onConfirm: (toPrefix: string) => Promise<void>;
  isLoading?: boolean;
}

export function MoveFilesDialog({
  open,
  onClose,
  sourcePrefix,
  selectedKeys,
  bucketSlug,
  onConfirm,
  isLoading = false,
}: MoveFilesDialogProps) {
  const normalizedSource = normalizePrefix(sourcePrefix);

  const [browsingPrefix, setBrowsingPrefix] = useState(normalizedSource);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [destFiles, setDestFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictNames, setConflictNames] = useState<string[]>([]);
  const [pendingToPrefix, setPendingToPrefix] = useState<string | null>(null);

  const pathSegments = browsingPrefix ? browsingPrefix.replace(/\/+$/, "").split("/") : [];
  const isSameAsSource = normalizePrefix(browsingPrefix) === normalizedSource;

  const fetchObjects = useCallback(
    async (prefix: string) => {
      setError(null);
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("bucket", bucketSlug);
        params.set("prefix", prefix);
        const res = await fetch(`/api/dashboard/r2/objects?${params.toString()}`);
        const data = (await res.json()) as {
          folders?: FolderItem[];
          files?: FileItem[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "Không thể tải danh sách");
        }
        setFolders(Array.isArray(data.folders) ? data.folders : []);
        setDestFiles(Array.isArray(data.files) ? data.files : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi tải thư mục");
      } finally {
        setLoading(false);
      }
    },
    [bucketSlug],
  );

  useEffect(() => {
    if (!open) return;
    setBrowsingPrefix(normalizedSource);
    setConflictDialogOpen(false);
    setPendingToPrefix(null);
  }, [open, normalizedSource]);

  useEffect(() => {
    if (!open || !bucketSlug) return;
    void fetchObjects(browsingPrefix);
  }, [open, bucketSlug, browsingPrefix, fetchObjects]);

  const handleSelectFolder = useCallback((folder: FolderItem) => {
    setBrowsingPrefix(normalizePrefix(folder.prefix));
  }, []);

  const handleBreadcrumb = useCallback((index: number) => {
    if (index < 0) {
      setBrowsingPrefix("");
      return;
    }
    const segs = browsingPrefix.replace(/\/+$/, "").split("/").filter(Boolean);
    const toSegs = segs.slice(0, index + 1);
    setBrowsingPrefix(toSegs.length ? `${toSegs.join("/")}/` : "");
  }, [browsingPrefix]);

  const sourceFileNames = selectedKeys.map((k: string) => k.split("/").pop() ?? k);
  const destFileNames = new Set(destFiles.map((f: FileItem) => f.name));
  const conflictingNames = sourceFileNames.filter((name: string) =>
    destFileNames.has(name),
  );

  const handleMoveHere = useCallback(() => {
    const toPrefix = normalizePrefix(browsingPrefix);
    if (toPrefix === normalizedSource) return;
    if (conflictingNames.length > 0) {
      setConflictNames(conflictingNames);
      setPendingToPrefix(toPrefix);
      setConflictDialogOpen(true);
      return;
    }
    void onConfirm(toPrefix).then(() => onClose());
  }, [
    browsingPrefix,
    normalizedSource,
    conflictingNames,
    onConfirm,
    onClose,
  ]);

  const handleConfirmOverwrite = useCallback(() => {
    if (!pendingToPrefix) return;
    setConflictDialogOpen(false);
    void onConfirm(pendingToPrefix).then(() => {
      setPendingToPrefix(null);
      onClose();
    });
  }, [pendingToPrefix, onConfirm, onClose]);

  const handleClose = useCallback(() => {
    if (!isLoading && !loading) onClose();
  }, [isLoading, loading, onClose]);

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent
          className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-0 p-0"
          showClose={!isLoading && !loading}
        >
          <div className="border-b border-border px-4 py-3">
            <DialogTitle className="text-lg font-semibold">
              Di chuyển {selectedKeys.length} file
            </DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Chọn thư mục đích (bấm vào thư mục để mở, sau đó bấm &quot;Di chuyển đến đây&quot;).
            </p>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-auto p-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                Đường dẫn
              </span>
              <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-muted/30 px-2 py-1.5 text-sm">
                <button
                  type="button"
                  onClick={() => handleBreadcrumb(-1)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Gốc
                </button>
                {pathSegments.map((seg: string, i: number) => (
                  <span key={i} className="flex items-center gap-1">
                    <ChevronRight className="size-4 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => handleBreadcrumb(i)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {seg}
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Đang tải...
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">
                  Thư mục con
                </span>
                <div className="grid max-h-48 grid-cols-2 gap-2 overflow-auto rounded-md border border-border bg-muted/20 p-2 sm:grid-cols-3">
                  {folders.map((folder: FolderItem) => (
                    <button
                      key={folder.prefix}
                      type="button"
                      onClick={() => handleSelectFolder(folder)}
                      className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 text-left transition-colors hover:bg-muted"
                    >
                      <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 truncate text-sm text-foreground">
                        {folder.name}
                      </span>
                    </button>
                  ))}
                  {folders.length === 0 && (
                    <span className="col-span-full py-2 text-center text-sm text-muted-foreground">
                      Không có thư mục con
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <p className="text-sm text-muted-foreground">
                Đích hiện tại:{" "}
                <span className="font-mono text-foreground">
                  {browsingPrefix || "(gốc)"}
                </span>
              </p>
              <Button
                type="button"
                onClick={handleMoveHere}
                disabled={
                  isSameAsSource || loading || isLoading || selectedKeys.length === 0
                }
              >
                Di chuyển đến đây
              </Button>
              {isSameAsSource && browsingPrefix && (
                <p className="text-xs text-muted-foreground">
                  Đây là thư mục nguồn, chọn thư mục khác.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-border px-4 py-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>File trùng tên</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-2">
                <p>
                  Trong thư mục đích đã có file trùng tên. Ghi đè sẽ thay thế file
                  cũ bằng file di chuyển.
                </p>
                <p className="font-medium text-foreground">Các file trùng:</p>
                <ul className="list-inside list-disc rounded border border-border bg-muted/30 px-3 py-2 text-sm">
                  {conflictNames.map((name: string) => (
                    <li key={name} className="truncate font-mono">
                      {name}
                    </li>
                  ))}
                </ul>
                <p>Bạn có muốn ghi đè các file này?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConflictDialogOpen(false);
                setPendingToPrefix(null);
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmOverwrite}>
              Ghi đè tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
