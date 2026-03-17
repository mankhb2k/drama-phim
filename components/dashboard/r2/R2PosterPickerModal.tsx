"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronRight,
  FolderOpen,
  ImageIcon,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, Input } from "@/components/ui";

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif)$/i;

type FolderItem = { name: string; prefix: string };
type FileItem = { key: string; name: string; publicUrl: string };

function PosterThumb({
  file,
  onSelect,
}: {
  file: FileItem;
  onSelect: () => void;
}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group mb-2 flex w-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-background text-left transition-colors hover:border-primary hover:bg-muted break-inside-avoid-column"
    >
      <div className="relative w-full overflow-hidden bg-muted">
        <div className="relative w-full overflow-hidden bg-muted">
          {error ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-muted p-2 text-center">
              <ImageIcon className="size-8 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                Không tải được
              </span>
            </div>
          ) : (
            <>
              {!loaded && (
                <div className="absolute inset-0 animate-pulse bg-muted-foreground/10" />
              )}
              <img
                src={file.publicUrl}
                alt={file.name}
                className="block h-auto w-full object-cover object-center"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
              />
            </>
          )}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <ImageIcon className="size-8 text-white" />
        </div>
      </div>
      <span className="truncate px-2 py-1 text-xs text-muted-foreground">
        {file.name}
      </span>
    </button>
  );
}

interface R2PosterPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export function R2PosterPickerModal({
  open,
  onClose,
  onSelect,
}: R2PosterPickerModalProps) {
  const [buckets, setBuckets] = useState<Array<{ name: string }>>([]);
  const [bucket, setBucket] = useState<string>("");
  const [prefix, setPrefix] = useState<string>("");
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pathSegments = prefix ? prefix.replace(/\/+$/, "").split("/") : [];

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

  const fetchObjects = useCallback(
    async (b: string, p: string, searchQuery: string) => {
      if (!b) return;
      setError(null);
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("bucket", b);
        params.set("prefix", p);
        if (searchQuery.trim()) {
          params.set("search", searchQuery.trim());
        }
        const res = await fetch(
          `/api/dashboard/r2/objects?${params.toString()}`,
        );
        const data = (await res.json()) as {
          folders?: FolderItem[];
          files?: FileItem[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "Không thể tải danh sách");
        }
        setFolders(Array.isArray(data.folders) ? data.folders : []);
        const rawFiles = Array.isArray(data.files) ? data.files : [];
        const imageFiles = rawFiles.filter(
          (f: FileItem) => IMAGE_EXTENSIONS.test(f.name) && f.publicUrl,
        );
        setFiles(imageFiles);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi tải thư mục");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    setPrefix("");
    setError(null);
    void fetchBuckets();
  }, [open, fetchBuckets]);

  useEffect(() => {
    if (!open || !bucket) return;
    void fetchObjects(bucket, prefix, search);
  }, [open, bucket, prefix, search, fetchObjects]);

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

  const handleSelectImage = (url: string) => {
    onSelect(url);
    onClose();
  };

  const handleClose = () => {
    setPrefix("");
    setBucket("");
    setSearch("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        showClose={false}
        className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-0 p-0"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <DialogTitle className="text-lg font-semibold">
            Chọn poster từ R2
          </DialogTitle>
          <button
            type="button"
            onClick={handleClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Đóng"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              Chọn bucket
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
                              .concat("/"),
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
                  Tìm kiếm file trong thư mục
                </span>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Tên file..."
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">
                  Thư mục
                </span>
                {loading ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Đang tải...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {folders.map((folder: FolderItem) => (
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

              {files.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-foreground">
                    Ảnh (bấm để chọn làm poster)
                  </span>
                  <div className="max-h-[28rem] overflow-y-auto overflow-x-hidden">
                    <div className="columns-3 gap-2 columns-5">
                      {files.map((file: FileItem) => (
                        <PosterThumb
                          key={file.key}
                          file={file}
                          onSelect={() => handleSelectImage(file.publicUrl)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!loading && folders.length === 0 && files.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Không có thư mục hoặc ảnh nào trong đường dẫn này. (Chỉ hiển
                  thị file .jpg, .png, .webp, .gif)
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
