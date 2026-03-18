"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Input, Label } from "@/components/ui";
import { useConfirmStore } from "@/lib/stores/confirm-store";
import {
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  Film,
} from "lucide-react";

interface GenreRow {
  id: number;
  slug: string;
  name: string;
  order: number;
  _count: { movies: number };
}

function SortableGenreRow({
  genre,
  onEdit,
  onDelete,
}: {
  genre: GenreRow;
  onEdit: (g: GenreRow) => void;
  onDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: genre.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-border last:border-0 transition-shadow duration-200 hover:bg-muted/30 ${
        isDragging ? "z-10 bg-muted/80 shadow-lg" : ""
      }`}
    >
      <td className="w-10 cursor-grab active:cursor-grabbing px-2 py-3">
        <div
          className="flex touch-none items-center justify-center rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          {...listeners}
          {...attributes}
          aria-label="Kéo để sắp xếp"
        >
          <GripVertical className="size-4" />
        </div>
      </td>
      <td className="px-4 py-3 font-medium text-foreground">{genre.name}</td>
      <td className="px-4 py-3 text-muted-foreground">{genre.slug}</td>
      <td className="px-4 py-3 text-muted-foreground">
        {genre._count.movies}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onEdit(genre)}
            aria-label="Sửa thể loại"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(genre.id)}
            aria-label="Xóa thể loại"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function DashboardGenresPage() {
  const [genres, setGenres] = useState<GenreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<GenreRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "" });
  const [syncingOrder, setSyncingOrder] = useState(false);
  const openConfirm = useConfirmStore((s) => s.openConfirm);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const fetchGenres = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/genres", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setGenres(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/genres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: form.name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Tạo thể loại thất bại",
        );
        return;
      }
      setForm({ name: "" });
      await fetchGenres();
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (g: GenreRow) => {
    setEditing(g);
    setEditForm({ name: g.name, slug: g.slug });
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const res = await fetch(`/api/dashboard/genres/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editForm.name.trim(),
          slug: editForm.slug.trim() || undefined,
        }),
      });
      if (!res.ok) return;
      setEditing(null);
      await fetchGenres();
    } catch {
      // ignore
    }
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = genres.findIndex(
        (g: GenreRow) => g.id === (active.id as number),
      );
      const newIndex = genres.findIndex(
        (g: GenreRow) => g.id === (over.id as number),
      );
      if (oldIndex === -1 || newIndex === -1) return;
      const newOrder = arrayMove(genres, oldIndex, newIndex);
      setGenres(newOrder);
      setSyncingOrder(true);
      try {
        await Promise.all(
          newOrder.map((g: GenreRow, i: number) =>
            fetch(`/api/dashboard/genres/${g.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ order: i }),
            }),
          ),
        );
        await fetchGenres();
      } finally {
        setSyncingOrder(false);
      }
    },
    [genres],
  );

  const handleDelete = (id: number) => {
    const genre = genres.find((g: GenreRow) => g.id === id);
    openConfirm({
      title: "Xóa thể loại",
      description: genre
        ? `Xóa thể loại "${genre.name}"? Số phim đang gắn: ${genre._count.movies}. Thể loại sẽ bị bỏ khỏi các phim.`
        : "Xóa thể loại này?",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/dashboard/genres/${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (res.ok) await fetchGenres();
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
          Thể loại
        </h1>
        <p className="text-muted-foreground">
          Quản lý thể loại phim (Hành động, Tình cảm, ...). Giữ và kéo để sắp
          xếp.
        </p>
      </div>

      <section className="flex min-w-0 flex-col space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Film className="size-5" />
          Thêm thể loại
        </h2>
        <form
          onSubmit={handleAdd}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-3"
        >
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Tên thể loại</Label>
            <Input
              type="text"
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
              className="w-48 py-1.5"
              placeholder="VD: Hành động"
              required
            />
          </div>
          <Button type="submit" size="sm" disabled={submitting}>
            <Plus className="size-4" />
            Thêm
          </Button>
          {error && (
            <p className="w-full text-sm text-destructive">{error}</p>
          )}
        </form>

        {editing && (
          <form
            onSubmit={handleUpdate}
            className="flex flex-wrap items-end gap-3 rounded-lg border border-primary/50 bg-muted/30 p-3"
          >
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Tên</Label>
              <Input
                type="text"
                value={editForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
                className="w-48 py-1.5"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Slug</Label>
              <Input
                type="text"
                value={editForm.slug}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((p) => ({ ...p, slug: e.target.value }))
                }
                className="w-48 py-1.5"
              />
            </div>
            <Button type="submit" size="sm">
              Lưu
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(null)}
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
                  <th
                    className="w-10 px-2 py-3 font-medium text-foreground"
                    aria-label="Kéo để sắp xếp"
                  />
                  <th className="px-4 py-3 font-medium text-foreground">Tên</th>
                  <th className="px-4 py-3 font-medium text-foreground">Slug</th>
                  <th className="px-4 py-3 font-medium text-foreground">
                    Số phim
                  </th>
                  <th className="w-24 px-4 py-3 font-medium text-foreground" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : genres.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Chưa có thể loại. Thêm thể loại ở form trên.
                    </td>
                  </tr>
                ) : (
                  <DndContext
                    sensors={sensors}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={genres.map((g: GenreRow) => g.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {genres.map((g: GenreRow) => (
                        <SortableGenreRow
                          key={g.id}
                          genre={g}
                          onEdit={openEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </tbody>
            </table>
          </div>
          {syncingOrder && (
            <p className="border-t border-border px-4 py-2 text-center text-xs text-muted-foreground">
              Đang lưu thứ tự...
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
