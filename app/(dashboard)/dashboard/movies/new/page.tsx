"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Genre = { id: number; slug: string; name: string };
type Tag = { id: number; slug: string; name: string };

type ServerRow = {
  id: string;
  name: string;
  embedUrl: string;
  priority: number;
};
type EpisodeRow = {
  id: string;
  episodeNumber: number;
  name: string;
  servers: ServerRow[];
};

function genId() {
  return Math.random().toString(36).slice(2);
}

export default function DashboardNewMoviePage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [description, setDescription] = useState("");
  const [poster, setPoster] = useState("");
  const [backdrop, setBackdrop] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState<"ONGOING" | "COMPLETED">("ONGOING");
  const [genreIds, setGenreIds] = useState<number[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeRow[]>([]);

  const fetchOptions = useCallback(async () => {
    try {
      const [genresRes, tagsRes] = await Promise.all([
        fetch("/api/dashboard/genres"),
        fetch("/api/dashboard/tags"),
      ]);
      if (genresRes.ok) setGenres(await genresRes.json());
      if (tagsRes.ok) setTags(await tagsRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const toggleGenre = (id: number) => {
    setGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const toggleTag = (id: number) => {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const addEpisode = () => {
    const nextNum =
      episodes.length === 0
        ? 1
        : Math.max(...episodes.map((e) => e.episodeNumber)) + 1;
    setEpisodes((prev) => [
      ...prev,
      {
        id: genId(),
        episodeNumber: nextNum,
        name: "",
        servers: [],
      },
    ]);
  };

  const removeEpisode = (id: string) => {
    setEpisodes((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEpisode = (
    id: string,
    field: keyof EpisodeRow,
    value: number | string | ServerRow[]
  ) => {
    setEpisodes((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const addServer = (episodeId: string) => {
    setEpisodes((prev) =>
      prev.map((e) =>
        e.id === episodeId
          ? {
              ...e,
              servers: [
                ...e.servers,
                {
                  id: genId(),
                  name: "",
                  embedUrl: "",
                  priority: e.servers.length,
                },
              ],
            }
          : e
      )
    );
  };

  const removeServer = (episodeId: string, serverId: string) => {
    setEpisodes((prev) =>
      prev.map((e) =>
        e.id === episodeId
          ? { ...e, servers: e.servers.filter((s) => s.id !== serverId) }
          : e
      )
    );
  };

  const updateServer = (
    episodeId: string,
    serverId: string,
    field: keyof ServerRow,
    value: string | number
  ) => {
    setEpisodes((prev) =>
      prev.map((e) =>
        e.id === episodeId
          ? {
              ...e,
              servers: e.servers.map((s) =>
                s.id === serverId ? { ...s, [field]: value } : s
              ),
            }
          : e
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        originalTitle: originalTitle.trim() || undefined,
        description: description.trim() || undefined,
        poster: poster.trim() || undefined,
        backdrop: backdrop.trim() || undefined,
        year: year === "" ? undefined : Number(year),
        status,
        genreIds,
        tagIds,
        episodes: episodes.map((ep) => ({
          episodeNumber: ep.episodeNumber,
          name: ep.name.trim() || undefined,
          servers: ep.servers
            .filter((s) => s.name.trim() && s.embedUrl.trim())
            .map((s, i) => ({
              name: s.name.trim(),
              embedUrl: s.embedUrl.trim(),
              priority: i,
            })),
        })),
      };
      const res = await fetch("/api/dashboard/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error ?? "Thêm phim thất bại.",
        });
        return;
      }
      setMessage({
        type: "success",
        text: `Thêm phim thành công: "${data.title}" (${data.slug}${
          data.episodes?.length ? `, ${data.episodes.length} tập` : ""
        }).`,
      });
      setSubmitSuccess(true);
      setTitle("");
      setSlug("");
      setOriginalTitle("");
      setDescription("");
      setPoster("");
      setBackdrop("");
      setYear("");
      setStatus("ONGOING");
      setGenreIds([]);
      setTagIds([]);
      setEpisodes([]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNew = () => {
    setSubmitSuccess(false);
    setMessage(null);
  };

  if (loading) {
    return <p className="text-muted-foreground">Đang tải...</p>;
  }

  if (submitSuccess && message?.type === "success") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Thêm phim
          </h1>
        </div>
        <div className="flex max-w-2xl flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="rounded-md bg-green-500/10 text-green-700 dark:text-green-400">
            <p className="px-3 py-2 text-sm font-medium">{message.text}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2"
            >
              <Plus className="size-4" />
              Thêm phim mới
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/movies">Trở về danh sách phim</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Thêm phim
        </h1>
        <p className="text-muted-foreground">
          Điền thông tin phim và (tùy chọn) thêm tập với link server xem.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex max-w-3xl flex-col gap-8 rounded-xl border border-border bg-card p-6 shadow-sm"
      >
        {message && message.type === "error" && (
          <div className="rounded-md bg-destructive/10 text-destructive">
            <p className="px-3 py-2 text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Thông tin phim */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            Thông tin phim
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label
                htmlFor="title"
                className="text-sm font-medium text-foreground"
              >
                Tiêu đề <span className="text-destructive">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="VD: Trùm Quỷ Dương"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="slug"
                className="text-sm font-medium text-foreground"
              >
                Slug (để trống = tự tạo từ tiêu đề)
              </label>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="VD: trum-quy-duong"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="year"
                className="text-sm font-medium text-foreground"
              >
                Năm
              </label>
              <input
                id="year"
                type="number"
                min={1900}
                max={2100}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="2024"
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label
                htmlFor="originalTitle"
                className="text-sm font-medium text-foreground"
              >
                Tên gốc
              </label>
              <input
                id="originalTitle"
                type="text"
                value={originalTitle}
                onChange={(e) => setOriginalTitle(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="VD: Devil's Sun"
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label
                htmlFor="description"
                className="text-sm font-medium text-foreground"
              >
                Mô tả
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Tóm tắt nội dung phim..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="poster"
                className="text-sm font-medium text-foreground"
              >
                Poster (URL)
              </label>
              <input
                id="poster"
                type="url"
                value={poster}
                onChange={(e) => setPoster(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="https://..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="backdrop"
                className="text-sm font-medium text-foreground"
              >
                Backdrop (URL)
              </label>
              <input
                id="backdrop"
                type="url"
                value={backdrop}
                onChange={(e) => setBackdrop(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="https://..."
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label
                htmlFor="status"
                className="text-sm font-medium text-foreground"
              >
                Trạng thái
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "ONGOING" | "COMPLETED")
                }
                className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ONGOING">Đang chiếu</option>
                <option value="COMPLETED">Đã hoàn thành</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-sm font-medium text-foreground">
                Thể loại
              </span>
              <div className="flex flex-wrap gap-2">
                {genres.map((g: Genre) => (
                  <label
                    key={g.id}
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-input bg-background px-3 py-1.5 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                  >
                    <input
                      type="checkbox"
                      checked={genreIds.includes(g.id)}
                      onChange={() => toggleGenre(g.id)}
                      className="size-4 rounded border-input"
                    />
                    {g.name}
                  </label>
                ))}
                {genres.length === 0 && (
                  <span className="text-sm text-muted-foreground">
                    Chưa có thể loại.
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-sm font-medium text-foreground">Tag</span>
              <div className="flex flex-wrap gap-2">
                {tags.map((t: Tag) => (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-input bg-background px-3 py-1.5 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                  >
                    <input
                      type="checkbox"
                      checked={tagIds.includes(t.id)}
                      onChange={() => toggleTag(t.id)}
                      className="size-4 rounded border-input"
                    />
                    {t.name}
                  </label>
                ))}
                {tags.length === 0 && (
                  <span className="text-sm text-muted-foreground">
                    Chưa có tag.
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Tập phim + Link server */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Tập phim & Link server
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEpisode}
              className="inline-flex items-center gap-2"
            >
              <Plus className="size-4" />
              Thêm tập
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Mỗi tập có thể có nhiều server (VD: MixDrop, StreamTape). Điền tên
            server và link embed (iframe src).
          </p>

          {episodes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-muted-foreground">
              Chưa thêm tập nào. Bấm &quot;Thêm tập&quot; để thêm tập và link
              server.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {episodes.map((ep) => (
                <div
                  key={ep.id}
                  className="rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      value={ep.episodeNumber}
                      onChange={(e) =>
                        updateEpisode(
                          ep.id,
                          "episodeNumber",
                          Number(e.target.value) || 1
                        )
                      }
                      className="w-20 rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-sm font-medium text-foreground">
                      Tập
                    </span>
                    <input
                      type="text"
                      value={ep.name}
                      onChange={(e) =>
                        updateEpisode(ep.id, "name", e.target.value)
                      }
                      className="flex-1 min-w-0 rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Tên tập (tùy chọn)"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEpisode(ep.id)}
                      className="shrink-0 text-destructive hover:bg-destructive/10"
                      aria-label="Xóa tập"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Link server (embed URL)
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => addServer(ep.id)}
                        className="inline-flex items-center gap-1 text-xs"
                      >
                        <Plus className="size-3" />
                        Thêm server
                      </Button>
                    </div>
                    {ep.servers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Chưa thêm server. Bấm &quot;Thêm server&quot; và điền
                        tên (VD: MixDrop) + link embed.
                      </p>
                    ) : (
                      ep.servers.map((srv) => (
                        <div
                          key={srv.id}
                          className="flex flex-wrap items-center gap-2 rounded border border-border bg-background p-2"
                        >
                          <input
                            type="text"
                            value={srv.name}
                            onChange={(e) =>
                              updateServer(
                                ep.id,
                                srv.id,
                                "name",
                                e.target.value
                              )
                            }
                            className="w-28 rounded border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Tên (VD: MixDrop)"
                          />
                          <input
                            type="url"
                            value={srv.embedUrl}
                            onChange={(e) =>
                              updateServer(
                                ep.id,
                                srv.id,
                                "embedUrl",
                                e.target.value
                              )
                            }
                            className="min-w-0 flex-1 rounded border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                            placeholder="https://... (link embed iframe)"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeServer(ep.id, srv.id)}
                            className="shrink-0 text-destructive hover:bg-destructive/10"
                            aria-label="Xóa server"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Đang thêm..." : "Thêm phim"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/movies">Hủy</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
