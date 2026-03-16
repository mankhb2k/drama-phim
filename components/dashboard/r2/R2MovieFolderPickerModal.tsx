"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, FileVideo, FolderOpen, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, Checkbox } from "@/components/ui";

export type R2ApplyItem = {
  episodeNumber: number;
  objectKey: string;
  playbackUrl: string;
};

type FolderItem = { name: string; prefix: string };
type FileItem = { key: string; name: string; publicUrl: string };

const TAP_NAME_REGEX = /^tap-(\d+)(?:\.[^/]*)?$/i;

function tapNumFromName(name: string): number | null {
  const m = name.match(TAP_NAME_REGEX);
  return m ? parseInt(m[1], 10) : null;
}

interface R2MovieFolderPickerModalProps {
  open: boolean;
  onClose: () => void;
  episodes: { episodeNumber: number }[];
  onApply: (items: R2ApplyItem[]) => void;
}

export function R2MovieFolderPickerModal({
  open,
  onClose,
  episodes,
  onApply,
}: R2MovieFolderPickerModalProps) {
  const [buckets, setBuckets] = useState<Array<{ name: string }>>([]);
  const [bucket, setBucket] = useState<string>("");
  const [prefix, setPrefix] = useState<string>("");
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFiles, setCurrentFiles] = useState<FileItem[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingApply, setLoadingApply] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pathSegments = prefix ? prefix.replace(/\/+$/, "").split("/") : [];
  const canApplyAtCurrentFolder = pathSegments.length >= 1;

  const navigationFolders = folders.filter(
    (f: FolderItem) => tapNumFromName(f.name) == null
  );
  const tapNFolders = folders.filter(
    (f: FolderItem) => tapNumFromName(f.name) != null
  );
  const tapNFiles = currentFiles.filter(
    (f: FileItem) => !f.key.endsWith(".keep") && tapNumFromName(f.name) != null
  );
  const hasTapNItems = tapNFolders.length > 0 || tapNFiles.length > 0;
  const selectedCount = selectedKeys.size;

  const allTapIds = useMemo(
    () => [
      ...tapNFiles.map((f: FileItem) => f.key),
      ...tapNFolders.map((f: FolderItem) => f.prefix),
    ],
    [tapNFiles, tapNFolders],
  );
  const allTapSelected =
    allTapIds.length > 0 && allTapIds.every((id: string) => selectedKeys.has(id));

  const handleSelectAllTap = useCallback(() => {
    if (allTapSelected) {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        allTapIds.forEach((id: string) => next.delete(id));
        return next;
      });
    } else {
      setSelectedKeys((prev) => new Set([...prev, ...allTapIds]));
    }
  }, [allTapIds, allTapSelected]);

  const fetchBuckets = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/r2/buckets");
      const data = (await res.json()) as {
        buckets?: Array<{ name: string }>;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Không thể tải danh sách bucket");
      }
      const list = Array.isArray(data.buckets) ? data.buckets : [];
      setBuckets(list);
      if (list.length > 0 && !bucket) {
        setBucket(list[0].name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải bucket");
    } finally {
      setLoading(false);
    }
  }, [bucket]);

  const fetchObjects = useCallback(async (b: string, p: string) => {
    if (!b) return;
    setError(null);
    setLoading(true);
    setSelectedKeys(new Set());
    try {
      const params = new URLSearchParams();
      params.set("bucket", b);
      params.set("prefix", p);
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
      setCurrentFiles(Array.isArray(data.files) ? data.files : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải thư mục");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setPrefix("");
    setError(null);
    void fetchBuckets();
  }, [open, fetchBuckets]);

  useEffect(() => {
    if (!open || !bucket) return;
    void fetchObjects(bucket, prefix);
  }, [open, bucket, prefix, fetchObjects]);

  const handleSelectBucket = (b: string) => {
    setBucket(b);
    setPrefix("");
  };

  const handleSelectFolder = (folder: FolderItem) => {
    setPrefix(folder.prefix);
  };

  const handleBack = () => {
    if (pathSegments.length <= 1) {
      setPrefix("");
      return;
    }
    setPrefix(pathSegments.slice(0, -1).join("/") + "/");
  };

  const toggleSelected = useCallback((id: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleApply = useCallback(async () => {
    if (!bucket || !prefix) return;
    setError(null);
    setLoadingApply(true);
    try {
      const params = new URLSearchParams();
      params.set("bucket", bucket);
      params.set("prefix", prefix);
      const res = await fetch(`/api/dashboard/r2/objects?${params.toString()}`);
      const data = (await res.json()) as {
        files?: FileItem[];
        folders?: FolderItem[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Không thể tải danh sách file");
      }

      const episodeToFile = new Map<
        number,
        { key: string; publicUrl: string }
      >();

      if (Array.isArray(data.files)) {
        for (const f of data.files) {
          if (f.key.endsWith(".keep")) continue;
          const n = tapNumFromName(f.name);
          if (n != null && !episodeToFile.has(n)) {
            episodeToFile.set(n, { key: f.key, publicUrl: f.publicUrl });
          }
        }
      }

      if (Array.isArray(data.folders)) {
        for (const folder of data.folders) {
          const n = tapNumFromName(folder.name);
          if (n == null || episodeToFile.has(n)) continue;
          const subParams = new URLSearchParams();
          subParams.set("bucket", bucket);
          subParams.set("prefix", folder.prefix);
          const subRes = await fetch(
            `/api/dashboard/r2/objects?${subParams.toString()}`
          );
          const subData = (await subRes.json()) as {
            files?: Array<{ key: string; publicUrl: string }>;
          };
          const firstFile = Array.isArray(subData.files)
            ? subData.files.find(
                (x: { key: string }) => !x.key.endsWith(".keep")
              ) ?? subData.files[0]
            : undefined;
          if (firstFile?.key && firstFile?.publicUrl) {
            episodeToFile.set(n, {
              key: firstFile.key,
              publicUrl: firstFile.publicUrl,
            });
          }
        }
      }

      const items: R2ApplyItem[] = Array.from(episodeToFile.entries())
        .sort(([a], [b]) => a - b)
        .map(([episodeNumber, { key, publicUrl }]) => ({
          episodeNumber,
          objectKey: key,
          playbackUrl: publicUrl,
        }));

      if (items.length === 0) {
        setError(
          "Không tìm thấy file tap-N nào trong thư mục này (tap-1.mp4, tap-2, ...)."
        );
        return;
      }
      onApply(items);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi áp dụng");
    } finally {
      setLoadingApply(false);
    }
  }, [bucket, prefix, onApply, onClose]);

  const handleApplySelected = useCallback(async () => {
    if (!bucket || selectedKeys.size === 0) return;
    setError(null);
    const invalidNames: string[] = [];
    const resolved: Array<{
      episodeNumber: number;
      key: string;
      publicUrl: string;
    }> = [];

    const filesFiltered = currentFiles.filter(
      (f: FileItem) => !f.key.endsWith(".keep")
    );
    for (const key of selectedKeys) {
      const file = filesFiltered.find((f: FileItem) => f.key === key);
      if (file) {
        const n = tapNumFromName(file.name);
        if (n == null) {
          invalidNames.push(file.name);
        } else {
          resolved.push({
            episodeNumber: n,
            key: file.key,
            publicUrl: file.publicUrl,
          });
        }
        continue;
      }
      const folder = folders.find((f: FolderItem) => f.prefix === key);
      if (folder) {
        const n = tapNumFromName(folder.name);
        if (n == null) {
          invalidNames.push(folder.name);
          continue;
        }
        const subParams = new URLSearchParams();
        subParams.set("bucket", bucket);
        subParams.set("prefix", folder.prefix);
        const subRes = await fetch(
          `/api/dashboard/r2/objects?${subParams.toString()}`
        );
        const subData = (await subRes.json()) as {
          files?: Array<{ key: string; publicUrl: string }>;
        };
        const firstFile = Array.isArray(subData.files)
          ? subData.files.find(
              (x: { key: string }) => !x.key.endsWith(".keep")
            ) ?? subData.files[0]
          : undefined;
        if (firstFile?.key && firstFile?.publicUrl) {
          resolved.push({
            episodeNumber: n,
            key: firstFile.key,
            publicUrl: firstFile.publicUrl,
          });
        }
      }
    }

    if (invalidNames.length > 0) {
      setError(
        `Định dạng hoặc tên không đúng. Cần tap-N hoặc tap-N.mp4 (vd. tap-1, tap-2.mp4). Không hợp lệ: ${invalidNames.join(
          ", "
        )}`
      );
      return;
    }
    if (resolved.length === 0) {
      setError("Không có file nào hợp lệ để gắn.");
      return;
    }

    setLoadingApply(true);
    try {
      const items: R2ApplyItem[] = resolved
        .sort((a, b) => a.episodeNumber - b.episodeNumber)
        .map(({ episodeNumber, key, publicUrl }) => ({
          episodeNumber,
          objectKey: key,
          playbackUrl: publicUrl,
        }));
      onApply(items);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi áp dụng");
    } finally {
      setLoadingApply(false);
    }
  }, [bucket, currentFiles, folders, onApply, onClose, selectedKeys]);

  const handleClose = () => {
    if (!loadingApply) {
      setPrefix("");
      setBucket("");
      setCurrentFiles([]);
      setSelectedKeys(new Set());
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-0 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <DialogTitle className="text-lg font-semibold">
            Gắn R2 cho tất cả tập
          </DialogTitle>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              Chọn bucket (channel)
            </span>
            {loading && !bucket ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Đang tải bucket...
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {buckets.map((b: (typeof buckets)[number]) => (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() => handleSelectBucket(b.name)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      bucket === b.name
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {bucket && (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">
                  Đường dẫn
                </span>
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-muted/30 px-2 py-1.5 text-sm">
                  <button
                    type="button"
                    onClick={() => setPrefix("")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {bucket}
                  </button>
                  {pathSegments.map((seg: string, i: number) => (
                    <span key={i} className="flex items-center gap-1">
                      <ChevronRight className="size-4 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() =>
                          setPrefix(
                            pathSegments
                              .slice(0, i + 1)
                              .join("/")
                              .concat("/")
                          )
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {seg}
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {pathSegments.length > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="self-start text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Quay lại
                </button>
              )}

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">
                  {prefix
                    ? "Chọn thư mục phim (bấm vào thư mục để vào bên trong)"
                    : "Chọn thư mục video"}
                </span>
                {loading ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Đang tải...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {navigationFolders.map((folder: FolderItem) => (
                      <button
                        key={folder.prefix}
                        type="button"
                        onClick={() => handleSelectFolder(folder)}
                        className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-muted"
                      >
                        <FolderOpen className="size-5 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm font-medium text-foreground">
                          {folder.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {canApplyAtCurrentFolder && !loading && hasTapNItems && (
                <>
                  <div className="flex flex-col gap-2 border-t border-border pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">
                        Tập trong thư mục này (tap-1, tap-2, ...)
                      </span>
                      <button
                        type="button"
                        className="rounded border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
                        onClick={handleSelectAllTap}
                      >
                        {allTapSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                      </button>
                    </div>
                    <div className="max-h-64 space-y-1 overflow-auto rounded-md border border-border bg-muted/20 p-2">
                      {tapNFiles.map((f: FileItem) => {
                        const ep = tapNumFromName(f.name)!;
                        const id = f.key;
                        const checked = selectedKeys.has(id);
                        return (
                          <label
                            key={id}
                            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleSelected(id)}
                            />
                            <FileVideo className="size-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                              {f.name}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              Tập {ep}
                            </span>
                          </label>
                        );
                      })}
                      {tapNFolders.map((folder: FolderItem) => {
                        const ep = tapNumFromName(folder.name)!;
                        const id = folder.prefix;
                        const checked = selectedKeys.has(id);
                        return (
                          <label
                            key={id}
                            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleSelected(id)}
                            />
                            <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                              {folder.name}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              Tập {ep}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                    <button
                      type="button"
                      onClick={() => void handleApply()}
                      disabled={loadingApply}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {loadingApply ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Đang quét R2...
                        </>
                      ) : (
                        <>Gắn tất các tập</>
                      )}
                    </button>
                    {selectedCount > 0 && (
                      <button
                        type="button"
                        onClick={() => void handleApplySelected()}
                        disabled={loadingApply}
                        className="inline-flex items-center gap-2 rounded-md border border-primary bg-background px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                      >
                        Gắn {selectedCount} tập đã chọn
                      </button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
