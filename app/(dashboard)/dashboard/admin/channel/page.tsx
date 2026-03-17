"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Input, Label } from "@/components/ui";
import { Pencil, Plus, Trash2, Tv, Film, ChevronDown, ChevronRight } from "lucide-react";

interface ChannelRow {
  id: number;
  slug: string;
  name: string;
  createdAt: string;
  movieCount?: number;
}

interface MovieInChannel {
  id: number;
  slug: string;
  title: string;
  year: number | null;
  status: string;
  updatedAt: string;
  _count: { episodes: number };
}

export default function DashboardChannelPage() {
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ slug: "", name: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<ChannelRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "" });
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    slug: string;
    name: string;
    movies: MovieInChannel[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/channels", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { items?: ChannelRow[] };
      setChannels(Array.isArray(data.items) ? data.items : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const fetchDetail = useCallback(async (slug: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/dashboard/channels/${encodeURIComponent(slug)}`, {
        credentials: "include",
      });
      if (!res.ok) {
        setDetail(null);
        return;
      }
      const data = (await res.json()) as {
        slug: string;
        name: string;
        movies: MovieInChannel[];
      };
      setDetail({ slug: data.slug, name: data.name, movies: data.movies ?? [] });
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const toggleExpand = (c: ChannelRow) => {
    if (expandedSlug === c.slug) {
      setExpandedSlug(null);
      setDetail(null);
    } else {
      setExpandedSlug(c.slug);
      fetchDetail(c.slug);
    }
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          slug: form.slug.trim(),
          name: form.name.trim() || form.slug.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Tạo channel thất bại");
        return;
      }
      setForm({ slug: "", name: "" });
      await fetchChannels();
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/dashboard/channels/${encodeURIComponent(editing.slug)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: editForm.name.trim(),
            slug: editForm.slug.trim() || undefined,
          }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Cập nhật thất bại");
        return;
      }
      setEditing(null);
      if (expandedSlug === editing.slug) {
        setExpandedSlug(null);
        setDetail(null);
      }
      await fetchChannels();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (c: ChannelRow) => {
    if (c.slug === "dramahd") {
      alert("Không thể xóa channel mặc định 'dramahd'.");
      return;
    }
    const msg =
      (c.movieCount ?? 0) > 0
        ? `Channel "${c.name}" đang có ${c.movieCount} phim. Xóa sẽ chuyển các phim về channel "dramahd". Bạn chắc chắn?`
        : `Xóa channel "${c.name}"?`;
    if (!window.confirm(msg)) return;
    try {
      const res = await fetch(
        `/api/dashboard/channels/${encodeURIComponent(c.slug)}?force=1`,
        { method: "DELETE", credentials: "include" },
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Xóa thất bại");
        return;
      }
      if (expandedSlug === c.slug) {
        setExpandedSlug(null);
        setDetail(null);
      }
      await fetchChannels();
    } catch {
      setError("Xóa thất bại");
    }
  };

  const startEdit = (c: ChannelRow) => {
    setEditing(c);
    setEditForm({ name: c.name, slug: c.slug });
    setError("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Quản lý Channel
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thêm, sửa, xóa channel. Mỗi channel gắn với danh sách phim (dùng cho URL xem phim).
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Plus className="size-5" />
          Thêm channel
        </h2>
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-slug">Slug</Label>
            <Input
              id="new-slug"
              value={form.slug}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((p) => ({ ...p, slug: e.target.value }))
              }
              placeholder="vd: nsh, drama-hd"
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-name">Tên hiển thị</Label>
            <Input
              id="new-name"
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="VD: NSH, Drama HD"
              className="w-48"
            />
          </div>
          <Button type="submit" disabled={submitting || !form.slug.trim()}>
            {submitting ? "Đang tạo..." : "Thêm"}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Tv className="size-5" />
          Danh sách channel
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : channels.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có channel nào.</p>
        ) : (
          <div className="space-y-2">
            {channels.map((c: ChannelRow) => (
              <div
                key={c.id}
                className="rounded-lg border border-border bg-background/50"
              >
                <div className="flex flex-wrap items-center gap-2 p-3">
                  <button
                    type="button"
                    onClick={() => toggleExpand(c)}
                    className="flex items-center gap-1 text-left font-medium text-foreground hover:underline"
                  >
                    {expandedSlug === c.slug ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                    <span>{c.name}</span>
                    <span className="text-muted-foreground">({c.slug})</span>
                  </button>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {c.movieCount ?? 0} phim
                  </span>
                  <div className="ml-auto flex gap-2">
                    {editing?.id === c.id ? (
                      <form
                        onSubmit={handleUpdate}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <Input
                          value={editForm.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEditForm((p) => ({ ...p, name: e.target.value }))
                          }
                          placeholder="Tên"
                          className="h-8 w-32"
                        />
                        <Input
                          value={editForm.slug}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEditForm((p) => ({ ...p, slug: e.target.value }))
                          }
                          placeholder="Slug"
                          className="h-8 w-28"
                        />
                        <Button type="submit" size="sm" disabled={submitting}>
                          Lưu
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(null)}
                        >
                          Hủy
                        </Button>
                      </form>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(c)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(c)}
                          disabled={c.slug === "dramahd"}
                          title={c.slug === "dramahd" ? "Không xóa channel mặc định" : "Xóa"}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {expandedSlug === c.slug && (
                  <div className="border-t border-border bg-muted/20 p-3">
                    {detailLoading ? (
                      <p className="text-sm text-muted-foreground">Đang tải phim...</p>
                    ) : detail && detail.slug === c.slug ? (
                      detail.movies.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Channel này chưa có phim nào.
                        </p>
                      ) : (
                        <ul className="flex flex-col gap-1">
                          {detail.movies.map((m: MovieInChannel) => (
                            <li key={m.id} className="flex items-center gap-2 text-sm">
                              <Film className="size-4 shrink-0 text-muted-foreground" />
                              <Link
                                href={`/dashboard/admin/movies/${m.slug}/edit`}
                                className="font-medium text-foreground hover:underline"
                              >
                                {m.title}
                              </Link>
                              <span className="text-muted-foreground">
                                {m.year ? `(${m.year})` : ""} · {m._count.episodes} tập
                              </span>
                            </li>
                          ))}
                        </ul>
                      )
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
