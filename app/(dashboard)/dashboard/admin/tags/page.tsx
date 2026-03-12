"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { useConfirmStore } from "@/lib/stores/confirm-store";
import { Pencil, Plus, Trash2, Tag, StickyNote } from "lucide-react";

interface TagRow {
  id: number;
  slug: string;
  name: string;
  order: number;
  _count: { movies: number };
}

interface LabelRow {
  id: number;
  slug: string;
  name: string;
  order: number;
  textColor: string | null;
  backgroundColor: string | null;
  _count: { movies: number };
}

/** Chuẩn hóa giá trị cho input type="color" (phải là #rrggbb) */
function toColorInputValue(value: string | null, fallback: string): string {
  if (value?.trim() && /^#[0-9A-Fa-f]{6}$/.test(value.trim()))
    return value.trim();
  return fallback;
}

export default function DashboardTagsPage() {
  const [tags, setTags] = useState<TagRow[]>([]);
  const [labels, setLabels] = useState<LabelRow[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [loadingLabels, setLoadingLabels] = useState(true);
  const [tagForm, setTagForm] = useState({ name: "", order: "" });
  const [labelForm, setLabelForm] = useState({
    name: "",
    order: "",
    textColor: "",
    backgroundColor: "",
  });
  const [tagSubmitting, setTagSubmitting] = useState(false);
  const [labelSubmitting, setLabelSubmitting] = useState(false);
  const [tagError, setTagError] = useState("");
  const [labelError, setLabelError] = useState("");
  const [editingTag, setEditingTag] = useState<TagRow | null>(null);
  const [editingLabel, setEditingLabel] = useState<LabelRow | null>(null);
  const [editTagForm, setEditTagForm] = useState({
    name: "",
    slug: "",
    order: "",
  });
  const [editLabelForm, setEditLabelForm] = useState({
    name: "",
    slug: "",
    order: "",
    textColor: "",
    backgroundColor: "",
  });

  const fetchTags = useCallback(async () => {
    setLoadingTags(true);
    try {
      const res = await fetch("/api/dashboard/tags", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setTags(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoadingTags(false);
    }
  }, []);

  const fetchLabels = useCallback(async () => {
    setLoadingLabels(true);
    try {
      const res = await fetch("/api/dashboard/labels", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setLabels(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoadingLabels(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
    fetchLabels();
  }, [fetchTags, fetchLabels]);

  const handleAddTag = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTagError("");
    setTagSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: tagForm.name.trim(),
          order: tagForm.order === "" ? undefined : Number(tagForm.order),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTagError(
          typeof data.error === "string" ? data.error : "Tạo tag thất bại",
        );
        return;
      }
      setTagForm({ name: "", order: "" });
      await fetchTags();
    } finally {
      setTagSubmitting(false);
    }
  };

  const handleAddLabel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLabelError("");
    setLabelSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: labelForm.name.trim(),
          order: labelForm.order === "" ? undefined : Number(labelForm.order),
          // Khi không chọn màu, gửi giá trị mặc định đang hiển thị (trắng / đỏ) thay vì null
          textColor: labelForm.textColor.trim() || "#ffffff",
          backgroundColor: labelForm.backgroundColor.trim() || "#e11d48",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLabelError(
          typeof data.error === "string" ? data.error : "Tạo label thất bại",
        );
        return;
      }
      setLabelForm({ name: "", order: "", textColor: "", backgroundColor: "" });
      await fetchLabels();
    } finally {
      setLabelSubmitting(false);
    }
  };

  const openEditTag = (t: TagRow) => {
    setEditingTag(t);
    setEditTagForm({ name: t.name, slug: t.slug, order: String(t.order) });
  };

  const openEditLabel = (l: LabelRow) => {
    setEditingLabel(l);
    setEditLabelForm({
      name: l.name,
      slug: l.slug,
      order: String(l.order),
      textColor: toColorInputValue(l.textColor, "#ffffff"),
      backgroundColor: toColorInputValue(l.backgroundColor, "#e11d48"),
    });
  };

  const handleUpdateTag = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTag) return;
    try {
      const res = await fetch(`/api/dashboard/tags/${editingTag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editTagForm.name.trim(),
          slug: editTagForm.slug.trim() || undefined,
          order:
            editTagForm.order === "" ? undefined : Number(editTagForm.order),
        }),
      });
      if (!res.ok) return;
      setEditingTag(null);
      await fetchTags();
    } catch {
      // ignore
    }
  };

  const handleUpdateLabel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingLabel) return;
    try {
      const res = await fetch(`/api/dashboard/labels/${editingLabel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editLabelForm.name.trim(),
          slug: editLabelForm.slug.trim() || undefined,
          order:
            editLabelForm.order === ""
              ? undefined
              : Number(editLabelForm.order),
          textColor: editLabelForm.textColor.trim() || null,
          backgroundColor: editLabelForm.backgroundColor.trim() || null,
        }),
      });
      if (!res.ok) return;
      setEditingLabel(null);
      await fetchLabels();
    } catch {
      // ignore
    }
  };

  const openConfirm = useConfirmStore((s) => s.openConfirm);

  const handleDeleteTag = (id: number) => {
    openConfirm({
      title: "Xóa tag",
      description: "Xóa tag này? Phim gắn tag sẽ bỏ liên kết.",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/dashboard/tags/${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (res.ok) await fetchTags();
        } catch {
          // ignore
        }
      },
    });
  };

  const handleDeleteLabel = (id: number) => {
    openConfirm({
      title: "Xóa label",
      description: "Xóa label này? Phim gắn label sẽ bỏ liên kết.",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/dashboard/labels/${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (res.ok) await fetchLabels();
        } catch {
          // ignore
        }
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Tag & Nhãn
        </h1>
        <p className="text-muted-foreground">
          Quản lý tag và nhãn hiển thị (Hot, Phim mới, Đang chiếu...)
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        {/* --- Bảng Tag (trái) --- */}
        <section className="flex min-w-0 flex-col space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Tag className="size-5" />
            Tag
          </h2>
          <form
            onSubmit={handleAddTag}
            className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-3"
          >
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Tên tag</Label>
              <Input
                type="text"
                value={tagForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTagForm((p) => ({ ...p, name: e.target.value }))
                }
                className="w-40 py-1.5"
                placeholder="VD: han-quoc"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Thứ tự</Label>
              <Input
                type="number"
                min={1}
                value={tagForm.order}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTagForm((p) => ({ ...p, order: e.target.value }))
                }
                className="w-20 py-1.5"
                placeholder="1"
              />
            </div>
            <Button type="submit" size="sm" disabled={tagSubmitting}>
              <Plus className="size-4" />
              Thêm tag
            </Button>
            {tagError && (
              <p className="w-full text-sm text-destructive">{tagError}</p>
            )}
          </form>

          {editingTag && (
            <form
              onSubmit={handleUpdateTag}
              className="flex flex-wrap items-end gap-3 rounded-lg border border-primary/50 bg-muted/30 p-3"
            >
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Tên</Label>
                <Input
                  type="text"
                  value={editTagForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditTagForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-40 py-1.5"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Slug</Label>
                <Input
                  type="text"
                  value={editTagForm.slug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditTagForm((p) => ({ ...p, slug: e.target.value }))
                  }
                  className="w-40 py-1.5"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Thứ tự</Label>
                <Input
                  type="number"
                  min={1}
                  value={editTagForm.order}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditTagForm((p) => ({ ...p, order: e.target.value }))
                  }
                  className="w-20 py-1.5"
                />
              </div>
              <Button type="submit" size="sm">
                Lưu
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingTag(null)}
              >
                Hủy
              </Button>
            </form>
          )}

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[18.75rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 font-medium text-foreground">
                      Tên
                    </th>
                    <th className="px-4 py-3 font-medium text-foreground">
                      Thứ tự
                    </th>
                    <th className="px-4 py-3 font-medium text-foreground">
                      Số phim
                    </th>
                    <th className="px-4 py-3 font-medium text-foreground w-24" />
                  </tr>
                </thead>
                <tbody>
                  {loadingTags ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        Đang tải...
                      </td>
                    </tr>
                  ) : tags.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        Chưa có tag.
                      </td>
                    </tr>
                  ) : (
                    tags.map((t: TagRow) => (
                      <tr
                        key={t.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 font-medium text-foreground lowercase">
                          {t.slug}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {t.order}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {t._count.movies}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => openEditTag(t)}
                              aria-label="Sửa tag"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteTag(t.id)}
                              aria-label="Xóa tag"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* --- Bảng Label (phải) --- */}
        <section className="flex min-w-0 flex-col space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <StickyNote className="size-5" />
            Nhãn (Hot, Phim mới, Đang chiếu...)
          </h2>
          <form
            onSubmit={handleAddLabel}
            className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-3"
          >
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Tên nhãn</Label>
              <Input
                type="text"
                value={labelForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLabelForm((p) => ({ ...p, name: e.target.value }))
                }
                className="w-40 py-1.5"
                placeholder="VD: Hot"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Thứ tự</Label>
              <Input
                type="number"
                min={1}
                value={labelForm.order}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLabelForm((p) => ({ ...p, order: e.target.value }))
                }
                className="w-20 py-1.5"
                placeholder="1"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Màu chữ</Label>
              <Input
                type="color"
                value={toColorInputValue(labelForm.textColor, "#ffffff")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLabelForm((p) => ({ ...p, textColor: e.target.value }))
                }
                className="h-9 w-14 cursor-pointer rounded border border-input bg-background p-0.5"
                title="Chọn màu chữ"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Màu nền</Label>
              <Input
                type="color"
                value={toColorInputValue(labelForm.backgroundColor, "#e11d48")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLabelForm((p) => ({
                    ...p,
                    backgroundColor: e.target.value,
                  }))
                }
                className="h-9 w-14 cursor-pointer rounded border border-input bg-background p-0.5"
                title="Chọn màu nền"
              />
            </div>
            <Button type="submit" size="sm" disabled={labelSubmitting}>
              <Plus className="size-4" />
              Thêm nhãn
            </Button>
            {labelError && (
              <p className="w-full text-sm text-destructive">{labelError}</p>
            )}
          </form>

          {editingLabel && (
            <form
              onSubmit={handleUpdateLabel}
              className="flex flex-wrap items-end gap-3 rounded-lg border border-primary/50 bg-muted/30 p-3"
            >
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Tên</Label>
                <Input
                  type="text"
                  value={editLabelForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditLabelForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-40 py-1.5"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Slug</Label>
                <Input
                  type="text"
                  value={editLabelForm.slug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditLabelForm((p) => ({ ...p, slug: e.target.value }))
                  }
                  className="w-40 py-1.5"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Thứ tự</Label>
                <Input
                  type="number"
                  min={1}
                  value={editLabelForm.order}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditLabelForm((p) => ({ ...p, order: e.target.value }))
                  }
                  className="w-20 py-1.5"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Màu chữ</Label>
                <Input
                  type="color"
                  value={toColorInputValue(editLabelForm.textColor, "#ffffff")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditLabelForm((p) => ({
                      ...p,
                      textColor: e.target.value,
                    }))
                  }
                  className="h-9 w-14 cursor-pointer rounded border border-input bg-background p-0.5"
                  title="Chọn màu chữ"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Màu nền</Label>
                <Input
                  type="color"
                  value={toColorInputValue(
                    editLabelForm.backgroundColor,
                    "#e11d48",
                  )}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditLabelForm((p) => ({
                      ...p,
                      backgroundColor: e.target.value,
                    }))
                  }
                  className="h-9 w-14 cursor-pointer rounded border border-input bg-background p-0.5"
                  title="Chọn màu nền"
                />
              </div>
              <Button type="submit" size="sm">
                Lưu
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingLabel(null)}
              >
                Hủy
              </Button>
            </form>
          )}

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[18.75rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 font-medium text-foreground">
                      Tên
                    </th>
                    <th className="px-4 py-3 font-medium text-foreground">
                      Slug
                    </th>
                    <th className="px-4 py-3 font-medium text-foreground">
                      Thứ tự
                    </th>
                    <th className="px-4 py-3 font-medium text-foreground">
                      Số phim
                    </th>
                    <th className="px-4 py-3 font-medium text-foreground w-24" />
                  </tr>
                </thead>
                <tbody>
                  {loadingLabels ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        Đang tải...
                      </td>
                    </tr>
                  ) : labels.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        Chưa có nhãn.
                      </td>
                    </tr>
                  ) : (
                    labels.map((l: LabelRow) => (
                      <tr
                        key={l.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex rounded px-1.5 py-0.5 text-[0.625rem] font-semibold"
                            style={{
                              color: l.textColor ?? "#fff",
                              backgroundColor:
                                l.backgroundColor ?? "rgba(0,0,0,0.6)",
                            }}
                          >
                            {l.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {l.slug}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {l.order}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {l._count.movies}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => openEditLabel(l)}
                              aria-label="Sửa nhãn"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteLabel(l.id)}
                              aria-label="Xóa nhãn"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
