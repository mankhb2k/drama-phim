"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Trash2, Cloud, Subtitles } from "lucide-react";
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

type Genre = { id: number; slug: string; name: string };
type Tag = { id: number; slug: string; name: string };
type Label = { id: number; slug: string; name: string };

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

function genId() {
  return Math.random().toString(36).slice(2);
}

export default function DashboardNewMoviePage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
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
  const [r2MoviePickerOpen, setR2MoviePickerOpen] = useState(false);
  const [r2SubPickerOpen, setR2SubPickerOpen] = useState(false);
  const [r2PosterPickerOpen, setR2PosterPickerOpen] = useState(false);

  const fetchOptions = useCallback(async () => {
    try {
      const [genresRes, tagsRes, labelsRes] = await Promise.all([
        fetch("/api/dashboard/genres"),
        fetch("/api/dashboard/tags"),
        fetch("/api/dashboard/labels"),
      ]);
      if (genresRes.ok) setGenres(await genresRes.json());
      if (tagsRes.ok) setTags(await tagsRes.json());
      if (labelsRes.ok) setLabels(await labelsRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

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
        if (!channel) {
          setChannel(items[0]?.slug ?? "dramahd");
        }
      }
    } catch {
      // ignore, dùng default
    } finally {
      setChannelLoading(false);
    }
  }, [channel]);

  useEffect(() => {
    fetchOptions();
    fetchChannels();
  }, [fetchOptions, fetchChannels]);

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

  const toggleLabel = (id: number) => {
    setLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l: number) => l !== id) : [...prev, id],
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
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        channel: channel.trim() || "dramahd",
        audioType,
        originalTitle: originalTitle.trim() || undefined,
        description: description.trim() || undefined,
        poster: poster.trim() || undefined,
        year: year === "" ? undefined : Number(year),
        status,
        genreIds,
        tagIds,
        labelIds,
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
              sourceType: s.sourceType,
              storageProvider: s.storageProvider,
              subtitleUrl: s.subtitleUrl.trim() || undefined,
              vastTagUrl: s.vastTagUrl.trim() || undefined,
              mimeType: s.mimeType.trim() || undefined,
              fileSizeBytes: s.fileSizeBytes ?? undefined,
              priority: i,
              isActive: s.isActive,
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
        addToast("error", data.error ?? "Thêm phim thất bại.");
        return;
      }
      addToast(
        "success",
        `Thêm phim thành công: "${data.title}" (${data.slug}${
          data.episodes?.length ? `, ${data.episodes.length} tập` : ""
        }).`,
      );
      setSubmitSuccess(true);
      setTitle("");
      setSlug("");
      setChannel("dramahd");
      setOriginalTitle("");
      setDescription("");
      setPoster("");
      setYear("");
      setStatus("ONGOING");
      setAudioType("NONE");
      setGenreIds([]);
      setTagIds([]);
      setEpisodes([]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNew = () => {
    setSubmitSuccess(false);
  };

  if (loading) {
    return <p className="text-muted-foreground">Đang tải...</p>;
  }

  if (submitSuccess) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Thêm phim
          </h1>
        </div>
        <div className="flex max-w-2xl flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Đã thêm phim thành công. Bạn có thể thêm phim mới hoặc trở về danh
            sách.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2"
            >
              <Plus className="size-4" />
              Thêm phim mới
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/admin/movies">Trở về danh sách phim</Link>
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
        {/* Thông tin phim */}
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
              <Label htmlFor="slug">Slug (để trống = tự tạo từ tiêu đề)</Label>
              <Input
                id="slug"
                type="text"
                value={slug}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSlug(e.target.value)
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
                {labels.map((l: Label) => (
                  <label
                    key={l.id}
                    className="checkbox-pill flex cursor-pointer items-center gap-2 rounded-full border border-input bg-background px-3 py-1.5 text-sm transition-colors"
                  >
                    <Checkbox
                      checked={labelIds.includes(l.id)}
                      onCheckedChange={() => toggleLabel(l.id)}
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

        {/* Tập phim + Link server */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
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
                        Chưa thêm server. Bấm &quot;Thêm server&quot; và điền
                        tên (VD: MixDrop) + link embed.
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

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Đang thêm..." : "Thêm phim"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/admin/movies">Hủy</Link>
          </Button>
        </div>
      </form>

      <R2MovieFolderPickerModal
        open={r2MoviePickerOpen}
        onClose={() => setR2MoviePickerOpen(false)}
        episodes={episodes.map((ep: EpisodeRow) => ({
          episodeNumber: ep.episodeNumber,
        }))}
        onApply={handleR2Apply}
      />
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
    </div>
  );
}
