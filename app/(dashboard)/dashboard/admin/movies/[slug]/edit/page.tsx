"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Cloud, Subtitles } from "lucide-react";
import {
  Button,
  Select,
  Input,
  Textarea,
  Label,
  Checkbox,
  type SelectOption,
} from "@/components/ui";
import {
  R2MovieFolderPickerModal,
  type R2ApplyItem,
} from "@/components/dashboard/r2/R2MovieFolderPickerModal";
import {
  R2SubtitleFolderPickerModal,
  type R2SubApplyItem,
} from "@/components/dashboard/r2/R2SubtitleFolderPickerModal";
import { R2PosterPickerModal } from "@/components/dashboard/r2/R2PosterPickerModal";
import { useToastStore } from "@/lib/stores/toast-store";
import { useConfirmStore } from "@/lib/stores/confirm-store";

type Genre = { id: number; slug: string; name: string };
type Tag = { id: number; slug: string; name: string };

type ServerRow = {
  id: string;
  name: string;
  embedUrl: string;
  playbackUrl: string;
  objectKey: string;
  sourceType: "EMBED" | "DIRECT_VIDEO";
  storageProvider: "EXTERNAL" | "R2";
  subtitleUrl: string;
  vastTagUrl: string;
  mimeType: string;
  fileSizeBytes?: number;
  priority: number;
  isActive: boolean;
};
type EpisodeRow = {
  id: string;
  episodeNumber: number;
  name: string;
  subtitleUrl: string;
  servers: ServerRow[];
};

type MovieResponse = {
  id: number;
  slug: string;
  channel: string;
  title: string;
  originalTitle: string | null;
  description: string | null;
  poster: string | null;
  backdrop: string | null;
  year: number | null;
  status: "ONGOING" | "COMPLETED";
  audioType?: "NONE" | "SUB" | "DUBBED";
  genres: Genre[];
  tags: Tag[];
  labels: Array<{ id: number; slug: string; name: string }>;
  episodes: Array<{
    id: number;
    episodeNumber: number;
    name: string;
    subtitleUrl?: string | null;
    servers: Array<{
      id: number;
      name: string;
      embedUrl: string;
      playbackUrl: string | null;
      objectKey: string | null;
      sourceType: "EMBED" | "DIRECT_VIDEO";
      storageProvider: "EXTERNAL" | "R2";
      subtitleUrl: string | null;
      vastTagUrl: string | null;
      mimeType: string | null;
      fileSizeBytes: number | null;
      priority: number;
      isActive: boolean;
    }>;
  }>;
};

function genId() {
  return Math.random().toString(36).slice(2);
}

export default function EditMoviePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params?.slug as string | undefined;

  const [genres, setGenres] = useState<Genre[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [labels, setLabels] = useState<
    Array<{ id: number; slug: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  const [title, setTitle] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [channel, setChannel] = useState("dramahd");
  const [channelOptions, setChannelOptions] = useState<SelectOption[]>([
    { value: "dramahd", label: "DramaHD" },
  ]);
  const [channelLoading, setChannelLoading] = useState(false);
  const [originalTitle, setOriginalTitle] = useState("");
  const [description, setDescription] = useState("");
  const [poster, setPoster] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState<"ONGOING" | "COMPLETED">("ONGOING");
  const [audioType, setAudioType] = useState<"NONE" | "SUB" | "DUBBED">("NONE");
  const [genreIds, setGenreIds] = useState<number[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [labelIds, setLabelIds] = useState<number[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeRow[]>([]);
  const [originalEpisodes, setOriginalEpisodes] = useState<EpisodeRow[] | null>(
    null,
  );
  const [movieId, setMovieId] = useState<number | null>(null);
  const [r2MoviePickerOpen, setR2MoviePickerOpen] = useState(false);
  const [r2SubPickerOpen, setR2SubPickerOpen] = useState(false);
  const [r2PosterPickerOpen, setR2PosterPickerOpen] = useState(false);
  const fetchChannels = useCallback(async () => {
    setChannelLoading(true);
    try {
      const res = await fetch("/api/dashboard/channels", {
        credentials: "include",
      });
      if (!res.ok) return;
      const json = (await res.json()) as {
        items?: Array<{ slug: string; name: string }>;
      };
      const items = json.items ?? [];
      if (items.length > 0) {
        setChannelOptions(
          items.map((c: { slug: string; name: string }) => ({
            value: c.slug,
            label: c.name || c.slug,
          })),
        );
      }
    } catch {
      // ignore
    } finally {
      setChannelLoading(false);
    }
  }, []);

  const fetchMovieAndOptions = useCallback(async () => {
    if (!slug) return;
    try {
      const [movieRes, genresRes, tagsRes, labelsRes] = await Promise.all([
        fetch(`/api/dashboard/movies/${encodeURIComponent(slug)}`),
        fetch("/api/dashboard/genres"),
        fetch("/api/dashboard/tags"),
        fetch("/api/dashboard/labels"),
      ]);
      if (!movieRes.ok) {
        addToast("error", "Không tìm thấy phim.");
        setLoading(false);
        return;
      }
      const movie: MovieResponse = await movieRes.json();
      if (genresRes.ok) setGenres(await genresRes.json());
      if (tagsRes.ok) setTags(await tagsRes.json());
      if (labelsRes.ok) setLabels(await labelsRes.json());

      setMovieId(movie.id);
      setTitle(movie.title);
      const ch = movie.channel ?? "dramahd";
      setChannel(ch);
      setSlugInput(
        movie.slug.startsWith(ch + "-")
          ? movie.slug.slice(ch.length + 1)
          : movie.slug,
      );
      setOriginalTitle(movie.originalTitle ?? "");
      setDescription(movie.description ?? "");
      setPoster(movie.poster ?? "");
      setYear(movie.year != null ? String(movie.year) : "");
      setStatus(movie.status);
      setAudioType(movie.audioType ?? "NONE");
      setGenreIds(movie.genres.map((g: Genre) => g.id));
      setTagIds(movie.tags.map((t: Tag) => t.id));
      setLabelIds((movie.labels ?? []).map((l: { id: number }) => l.id));
      const mappedEpisodes: EpisodeRow[] = movie.episodes.map(
        (ep: (typeof movie.episodes)[number]) => ({
          id: genId(),
          episodeNumber: ep.episodeNumber,
          name: ep.name ?? "",
          subtitleUrl: ep.subtitleUrl ?? "",
          servers: ep.servers.map((s: (typeof ep.servers)[number]) => ({
            id: genId(),
            name: s.name,
            embedUrl: s.embedUrl,
            playbackUrl: s.playbackUrl ?? "",
            objectKey: s.objectKey ?? "",
            sourceType: s.sourceType,
            storageProvider: s.storageProvider,
            subtitleUrl: s.subtitleUrl ?? "",
            vastTagUrl: s.vastTagUrl ?? "",
            mimeType: s.mimeType ?? "",
            fileSizeBytes: s.fileSizeBytes ?? undefined,
            priority: s.priority,
            isActive: s.isActive,
          })),
        }),
      );
      setEpisodes(mappedEpisodes);
      setOriginalEpisodes(mappedEpisodes);
    } finally {
      setLoading(false);
    }
  }, [addToast, slug]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    fetchMovieAndOptions();
  }, [fetchMovieAndOptions]);

  const toggleGenre = (id: number) => {
    setGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g: number) => g !== id) : [...prev, id],
    );
  };
  const toggleTag = (id: number) => {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t: number) => t !== id) : [...prev, id],
    );
  };

  const addEpisode = () => {
    const nextNum =
      episodes.length === 0
        ? 1
        : Math.max(...episodes.map((e: EpisodeRow) => e.episodeNumber)) + 1;
    setEpisodes((prev) => [
      ...prev,
      {
        id: genId(),
        episodeNumber: nextNum,
        name: "",
        subtitleUrl: "",
        servers: [],
      },
    ]);
  };
  const removeEpisode = (id: string) => {
    setEpisodes((prev) => prev.filter((e: EpisodeRow) => e.id !== id));
  };
  const updateEpisode = (
    id: string,
    field: keyof EpisodeRow,
    value: number | string | ServerRow[],
  ) => {
    setEpisodes((prev) =>
      prev.map((e: EpisodeRow) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  };
  const addServer = (episodeId: string) => {
    setEpisodes((prev) =>
      prev.map((e: EpisodeRow) =>
        e.id === episodeId
          ? {
              ...e,
              servers: [
                ...e.servers,
                {
                  id: genId(),
                  name: "",
                  embedUrl: "",
                  playbackUrl: "",
                  objectKey: "",
                  sourceType: "EMBED",
                  storageProvider: "EXTERNAL",
                  subtitleUrl: "",
                  vastTagUrl: "",
                  mimeType: "",
                  priority: e.servers.length,
                  isActive: true,
                },
              ],
            }
          : e,
      ),
    );
  };
  const removeServer = (episodeId: string, serverId: string) => {
    setEpisodes((prev) =>
      prev.map((e: EpisodeRow) =>
        e.id === episodeId
          ? {
              ...e,
              servers: e.servers.filter((s: ServerRow) => s.id !== serverId),
            }
          : e,
      ),
    );
  };
  const handleR2Apply = useCallback((items: R2ApplyItem[]) => {
    if (items.length === 0) return;
    const maxEp = Math.max(...items.map((i: R2ApplyItem) => i.episodeNumber));
    setEpisodes((prev) => {
      const byNum = new Map(prev.map((e: EpisodeRow) => [e.episodeNumber, e]));
      for (let n = 1; n <= maxEp; n++) {
        if (!byNum.has(n)) {
          byNum.set(n, {
            id: genId(),
            episodeNumber: n,
            name: "",
            subtitleUrl: "",
            servers: [],
          });
        }
      }
      const next = Array.from(byNum.values()).sort(
        (a, b) => a.episodeNumber - b.episodeNumber,
      );
      return next.map((ep: EpisodeRow) => {
        const item = items.find(
          (i: R2ApplyItem) => i.episodeNumber === ep.episodeNumber,
        );
        if (!item) return ep;
        const existingR2 = ep.servers.find(
          (s: ServerRow) => s.storageProvider === "R2",
        );
        if (existingR2) {
          return {
            ...ep,
            servers: ep.servers.map((s: ServerRow) =>
              s.id === existingR2.id
                ? {
                    ...s,
                    name: s.name || "R2",
                    objectKey: item.objectKey,
                    playbackUrl: item.playbackUrl,
                    embedUrl: item.playbackUrl,
                    storageProvider: "R2" as const,
                    sourceType: "DIRECT_VIDEO" as const,
                  }
                : s,
            ),
          };
        }
        return {
          ...ep,
          servers: [
            ...ep.servers,
            {
              id: genId(),
              name: "R2",
              embedUrl: item.playbackUrl,
              playbackUrl: item.playbackUrl,
              objectKey: item.objectKey,
              sourceType: "DIRECT_VIDEO",
              storageProvider: "R2",
              subtitleUrl: "",
              vastTagUrl: "",
              mimeType: "",
              priority: ep.servers.length,
              isActive: true,
            },
          ],
        };
      });
    });
    setR2MoviePickerOpen(false);
  }, []);

  const handleR2SubApply = useCallback((items: R2SubApplyItem[]) => {
    if (items.length === 0) return;
    setEpisodes((prev) =>
      prev.map((ep: EpisodeRow) => {
        const item = items.find(
          (i: R2SubApplyItem) => i.episodeNumber === ep.episodeNumber,
        );
        if (!item) return ep;
        return { ...ep, subtitleUrl: item.subtitleUrl };
      }),
    );
    setR2SubPickerOpen(false);
  }, []);

  const updateServer = (
    episodeId: string,
    serverId: string,
    field: keyof ServerRow,
    value: ServerRow[keyof ServerRow],
  ) => {
    setEpisodes((prev) =>
      prev.map((e: EpisodeRow) =>
        e.id === episodeId
          ? {
              ...e,
              servers: e.servers.map((s: ServerRow) =>
                s.id === serverId ? { ...s, [field]: value } : s,
              ),
            }
          : e,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!slug) return;

    // Validate trùng số tập trên client để báo lỗi rõ ràng trước khi gọi API
    if (episodes.length > 0) {
      const seen = new Set<number>();
      const dup = new Set<number>();
      episodes.forEach((ep: EpisodeRow) => {
        const num = ep.episodeNumber;
        if (seen.has(num)) {
          dup.add(num);
        } else {
          seen.add(num);
        }
      });
      if (dup.size > 0) {
        addToast(
          "error",
          `Số tập bị trùng: ${Array.from(dup)
            .sort((a: number, b: number) => a - b)
            .join(", ")}. Mỗi tập phải có số khác nhau.`,
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slugInput.trim() || slug,
        channel: channel.trim() || "dramahd",
        audioType,
        originalTitle: originalTitle.trim() || undefined,
        description: description.trim() || undefined,
        poster: poster.trim() || undefined,
        year: year === "" || Number.isNaN(Number(year)) ? null : Number(year),
        status,
        genreIds,
        tagIds,
        labelIds,
      };
      const hasEpisodesChanged =
        originalEpisodes != null &&
        JSON.stringify(originalEpisodes) !== JSON.stringify(episodes);
      const res = await fetch(
        `/api/dashboard/movies/${encodeURIComponent(slug)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        addToast("error", data.error ?? "Cập nhật thất bại.");
        return;
      }

      // Nếu có thay đổi tập/server thì gọi endpoint riêng để rebuild
      if (hasEpisodesChanged) {
        if (!movieId) {
          addToast(
            "error",
            "Không xác định được ID phim để cập nhật danh sách tập.",
          );
          return;
        }
        const episodesPayload = {
          movieId,
          episodes: episodes.map((ep: EpisodeRow) => ({
            episodeNumber: ep.episodeNumber,
            name: ep.name.trim() || undefined,
            subtitleUrl: ep.subtitleUrl?.trim() || undefined,
            servers: ep.servers
              .filter(
                (s: ServerRow) =>
                  s.name.trim() && (s.playbackUrl.trim() || s.embedUrl.trim()),
              )
              .map((s: ServerRow, i: number) => ({
                name: s.name.trim(),
                embedUrl: s.embedUrl.trim(),
                playbackUrl: s.playbackUrl.trim() || undefined,
                objectKey: s.objectKey.trim() || undefined,
                r2FileId: undefined,
                sourceType: s.sourceType,
                storageProvider: s.storageProvider,
                subtitleUrl: s.subtitleUrl.trim() || undefined,
                vastTagUrl: s.vastTagUrl.trim() || undefined,
                mimeType: s.mimeType.trim() || undefined,
                fileSizeBytes: s.fileSizeBytes ?? undefined,
                durationSeconds: undefined,
                priority: i,
                isActive: s.isActive,
              })),
          })),
        };
        const epRes = await fetch(
          `/api/dashboard/movies/${encodeURIComponent(slug)}/episodes`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(episodesPayload),
          },
        );
        const epData = await epRes.json().catch(() => ({}));
        if (!epRes.ok) {
          addToast("error", epData.error ?? "Cập nhật danh sách tập thất bại.");
          return;
        }
        setOriginalEpisodes(episodes);
      }

      addToast("success", "Cập nhật phim thành công.");
      if (data.slug && data.slug !== slug) {
        router.replace(`/dashboard/admin/movies/${data.slug}/edit`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openConfirm = useConfirmStore((s) => s.openConfirm);

  const handleDelete = () => {
    if (!slug) return;
    const slugToDelete = slug;
    openConfirm({
      title: "Xóa phim",
      description:
        "Bạn có chắc muốn xóa phim này? Hành động không thể hoàn tác.",
      onConfirm: async () => {
        setDeleting(true);
        try {
          const res = await fetch(
            `/api/dashboard/movies/${encodeURIComponent(slugToDelete)}`,
            { method: "DELETE" },
          );
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            addToast("error", data.error ?? "Xóa phim thất bại.");
            return;
          }
          router.push("/dashboard/admin/movies");
          router.refresh();
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  if (!slug) {
    return <div className="text-muted-foreground">Thiếu slug phim.</div>;
  }

  if (loading) {
    return <p className="text-muted-foreground">Đang tải...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link
            href="/dashboard/admin/movies"
            aria-label="Trở về danh sách phim"
          >
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Sửa phim
          </h1>
          <p className="text-muted-foreground">{slug}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex max-w-3xl flex-col gap-8 rounded-xl border border-border bg-card p-6 shadow-sm"
      >
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            Thông tin phim
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="title">
                Tiêu đề <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTitle(e.target.value)
                }
                placeholder="VD: Trùm Quỷ Dương"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                type="text"
                value={slugInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSlugInput(e.target.value)
                }
                placeholder="VD: trum-quy-duong"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Select
                id="channel"
                label="Channel"
                options={channelOptions}
                value={channel}
                onChange={(value: string) => setChannel(value)}
                placeholder={channelLoading ? "Đang tải..." : "Chọn channel"}
                data-testid="channel-select"
              />
              <p className="text-xs text-muted-foreground">
                Quản lý channel tại{" "}
                <Link
                  href="/dashboard/admin/channel"
                  className="font-medium text-primary hover:underline"
                >
                  Dashboard → Channel
                </Link>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="year">Năm</Label>
              <Input
                id="year"
                type="number"
                min={1900}
                max={2100}
                value={year}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setYear(e.target.value)
                }
                placeholder="2024"
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="originalTitle">Tên gốc</Label>
              <Input
                id="originalTitle"
                type="text"
                value={originalTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setOriginalTitle(e.target.value)
                }
                placeholder="VD: Devil's Sun"
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                placeholder="Tóm tắt nội dung phim..."
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="poster">Poster (URL)</Label>
              <div className="flex gap-2">
                <Input
                  id="poster"
                  type="url"
                  value={poster}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPoster(e.target.value)
                  }
                  className="flex-1"
                  placeholder="https://..."
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setR2PosterPickerOpen(true)}
                  className="shrink-0"
                >
                  Chọn từ R2
                </Button>
              </div>
            </div>
            <Select
              id="status"
              label="Trạng thái"
              value={status}
              onChange={(v) => setStatus(v as "ONGOING" | "COMPLETED")}
              options={[
                { value: "ONGOING", label: "Đang chiếu" },
                { value: "COMPLETED", label: "Đã hoàn thành" },
              ]}
              className="sm:col-span-2"
            />
            <Select
              id="audioType"
              label="Loại phim"
              value={audioType}
              onChange={(v) => setAudioType(v as "NONE" | "SUB" | "DUBBED")}
              options={[
                { value: "NONE", label: "Không xác định" },
                { value: "SUB", label: "Phim sub" },
                { value: "DUBBED", label: "Phim lồng tiếng" },
              ]}
              className="sm:col-span-2"
            />
            <div className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-sm font-medium text-foreground">
                Thể loại
              </span>
              <div className="flex flex-wrap gap-2">
                {genres.map((g: Genre) => (
                  <label
                    key={g.id}
                    className="checkbox-pill flex cursor-pointer items-center gap-2 rounded-full border border-input bg-background px-3 py-1.5 text-sm transition-colors"
                  >
                    <Checkbox
                      checked={genreIds.includes(g.id)}
                      onCheckedChange={() => toggleGenre(g.id)}
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
              <span className="text-sm font-medium text-foreground">Nhãn</span>
              <div className="flex flex-wrap gap-2">
                {labels.map((l: { id: number; slug: string; name: string }) => (
                  <label
                    key={l.id}
                    className="checkbox-pill flex cursor-pointer items-center gap-2 rounded-full border border-input bg-background px-3 py-1.5 text-sm transition-colors"
                  >
                    <Checkbox
                      checked={labelIds.includes(l.id)}
                      onCheckedChange={() =>
                        setLabelIds((prev) =>
                          prev.includes(l.id)
                            ? prev.filter((id: number) => id !== l.id)
                            : [...prev, l.id],
                        )
                      }
                    />
                    {l.name}
                  </label>
                ))}
                {labels.length === 0 && (
                  <span className="text-sm text-muted-foreground">
                    Chưa có nhãn.
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
                    className="checkbox-pill flex cursor-pointer items-center gap-2 rounded-full border border-input bg-background px-3 py-1.5 text-sm transition-colors"
                  >
                    <Checkbox
                      checked={tagIds.includes(t.id)}
                      onCheckedChange={() => toggleTag(t.id)}
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

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Tập phim & Link server
            </h2>
            <div className="flex items-center gap-2">
              {audioType === "SUB" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setR2SubPickerOpen(true)}
                  className="inline-flex items-center gap-2"
                >
                  <Subtitles className="size-4" />
                  Gắn R2 sub cho các tập
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setR2MoviePickerOpen(true)}
                className="inline-flex items-center gap-2"
              >
                <Cloud className="size-4" />
                Gắn R2 cho tất cả tập
              </Button>
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
          </div>
          <p className="text-sm text-muted-foreground">
            Mỗi tập có thể có nhiều server. Điền tên server và link embed
            (iframe src).
          </p>

          {episodes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-muted-foreground">
              Chưa có tập. Bấm &quot;Thêm tập&quot; để thêm.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {episodes.map((ep: EpisodeRow) => (
                <div
                  key={ep.id}
                  className="rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <Input
                      type="number"
                      min={1}
                      value={ep.episodeNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateEpisode(
                          ep.id,
                          "episodeNumber",
                          Number(e.target.value) || 1,
                        )
                      }
                      className="w-20"
                    />
                    <span className="text-sm font-medium text-foreground">
                      Tập
                    </span>
                    <Input
                      type="text"
                      value={ep.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateEpisode(ep.id, "name", e.target.value)
                      }
                      className="min-w-0 flex-1"
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

                  {audioType === "SUB" && (
                    <div className="mb-3 flex flex-col gap-1">
                      <Label
                        htmlFor={`sub-${ep.id}`}
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Link sub tập {ep.episodeNumber}
                      </Label>
                      <Input
                        id={`sub-${ep.id}`}
                        type="url"
                        value={ep.subtitleUrl ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateEpisode(ep.id, "subtitleUrl", e.target.value)
                        }
                        className="py-1.5"
                        placeholder="https://..."
                      />
                    </div>
                  )}

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
                        Chưa thêm server.
                      </p>
                    ) : (
                      ep.servers.map((srv: ServerRow) => (
                        <div
                          key={srv.id}
                          className="flex flex-wrap items-center gap-2 rounded border border-border bg-background p-2"
                        >
                          <Input
                            type="text"
                            value={srv.name}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                              updateServer(
                                ep.id,
                                srv.id,
                                "name",
                                e.target.value,
                              )
                            }
                            className="w-28 py-1.5"
                            placeholder="VD: R2 Storage"
                          />
                          <Input
                            type="url"
                            value={srv.embedUrl}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                              updateServer(
                                ep.id,
                                srv.id,
                                "embedUrl",
                                e.target.value,
                              )
                            }
                            className="min-w-0 flex-1 py-1.5"
                            placeholder="https://cdn.com/video.mp4?"
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

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Đang cập nhật..." : "Cập nhật"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/admin/movies">Hủy</Link>
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? "Đang xóa..." : "Xóa phim"}
          </Button>
        </div>
      </form>
      <R2PosterPickerModal
        open={r2PosterPickerOpen}
        onClose={() => setR2PosterPickerOpen(false)}
        onSelect={(url: string) => setPoster(url)}
      />
      <R2SubtitleFolderPickerModal
        open={r2SubPickerOpen}
        onClose={() => setR2SubPickerOpen(false)}
        episodes={episodes.map((ep: EpisodeRow) => ({
          episodeNumber: ep.episodeNumber,
        }))}
        onApply={handleR2SubApply}
      />
      <R2MovieFolderPickerModal
        open={r2MoviePickerOpen}
        onClose={() => setR2MoviePickerOpen(false)}
        episodes={episodes.map((ep: EpisodeRow) => ({
          episodeNumber: ep.episodeNumber,
        }))}
        onApply={handleR2Apply}
      />
    </div>
  );
}
