"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Select,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import { UserPlus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirmStore } from "@/lib/stores/confirm-store";

interface UserRow {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  role: string;
  createdAt: string;
}

const ROLES = [
  { value: "USER", label: "User" },
  { value: "EDITOR", label: "Editor" },
  { value: "ADMIN", label: "Admin" },
] as const;

function roleLabel(role: string): string {
  return ROLES.find((r: (typeof ROLES)[number]) => r.value === role)?.label ?? role;
}

export default function DashboardUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "USER" as "ADMIN" | "EDITOR" | "USER",
  });
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    role: "USER" as "ADMIN" | "EDITOR" | "USER",
  });
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchMe = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCurrentUserId(data?.id ?? null);
      }
    } catch {
      // ignore
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/users", {
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Không tải được danh sách");
        setUsers([]);
        return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setError("Lỗi kết nối");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
          name: form.name.trim() || undefined,
          email: form.email.trim() || undefined,
          role: form.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Tạo user thất bại");
        return;
      }
      setForm({
        username: "",
        password: "",
        name: "",
        email: "",
        role: "USER",
      });
      setFormOpen(false);
      fetchUsers();
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: UserRow) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      name: user.name ?? "",
      email: user.email ?? "",
      password: "",
      role: user.role as "ADMIN" | "EDITOR" | "USER",
    });
    setEditError("");
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditError("");
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError("");
    setEditSubmitting(true);
    try {
      const payload: {
        username?: string;
        name?: string;
        email?: string;
        password?: string;
        role?: string;
      } = {
        username: editForm.username.trim(),
        name: editForm.name.trim() || undefined,
        email: editForm.email.trim() || undefined,
        role: editForm.role,
      };
      if (editForm.password.trim()) payload.password = editForm.password;
      const res = await fetch(`/api/dashboard/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error ?? "Cập nhật thất bại");
        return;
      }
      setUsers((prev) =>
        prev.map((u: UserRow) => (u.id === editingUser.id ? { ...u, ...data } : u)),
      );
      closeEditModal();
    } catch {
      setEditError("Lỗi kết nối");
    } finally {
      setEditSubmitting(false);
    }
  };

  const openConfirm = useConfirmStore((s) => s.openConfirm);

  const handleDeleteInModal = () => {
    if (!editingUser) return;
    const userId = editingUser.id;
    const username = editingUser.username;
    openConfirm({
      title: "Xóa user",
      description: `Xóa user "${username}"? Hành động không thể hoàn tác.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/dashboard/users/${userId}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setEditError(data.error ?? "Xóa thất bại");
            return;
          }
          setUsers((prev) => prev.filter((u: UserRow) => u.id !== userId));
          closeEditModal();
        } catch {
          setEditError("Lỗi kết nối");
        }
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Quản lý user
          </h1>
          <p className="text-muted-foreground">
            Thêm, xóa, phân quyền user (Admin, Editor, User).
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="shrink-0"
        >
          <UserPlus className="size-4" />
          Thêm user
        </Button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleAddUser}
          className="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            Thêm user mới
          </h2>
          {formError && (
            <p className="mb-2 text-sm text-destructive">{formError}</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-2">
              <Label>Tên đăng nhập *</Label>
              <Input
                type="text"
                value={form.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm((p) => ({ ...p, username: e.target.value }))
                }
                required
                minLength={2}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Mật khẩu *</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                required
                minLength={6}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tên hiển thị</Label>
              <Input
                type="text"
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <Select
              label="Quyền"
              value={form.role}
              onChange={(v) =>
                setForm((p) => ({
                  ...p,
                  role: v as "ADMIN" | "EDITOR" | "USER",
                }))
              }
              options={ROLES.map((r: (typeof ROLES)[number]) => ({
                value: r.value,
                label: r.label,
              }))}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang tạo..." : "Tạo user"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormOpen(false)}
            >
              Hủy
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              Đang tải...
            </div>
          ) : error ? (
            <div className="px-4 py-8 text-center text-destructive">
              {error}
            </div>
          ) : (
            <table className="w-full min-w-[37.5rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 font-medium text-foreground">
                    Tên đăng nhập
                  </th>
                  <th className="px-4 py-3 font-medium text-foreground">
                    Email
                  </th>
                  <th className="px-4 py-3 font-medium text-foreground">
                    Tên hiển thị
                  </th>
                  <th className="px-4 py-3 font-medium text-foreground">
                    Quyền
                  </th>
                  <th className="px-4 py-3 font-medium text-foreground">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Chưa có user nào.
                    </td>
                  </tr>
                ) : (
                  users.map((user: UserRow) => (
                    <tr
                      key={user.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {user.username}
                        {currentUserId === user.id && (
                          <span className="ml-1 text-muted-foreground text-xs">
                            (bạn)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-sm",
                            user.role === "ADMIN" &&
                              "font-medium text-foreground",
                            user.role === "EDITOR" && "text-muted-foreground",
                          )}
                        >
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(user)}
                          aria-label="Sửa user"
                        >
                          <Pencil className="size-4" />
                          Sửa
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal sửa user */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && closeEditModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? `Sửa user: ${editingUser.username}` : "Sửa user"}
            </DialogTitle>
          </DialogHeader>
          {editingUser && (
            <>
              {editError && (
                <p className="mb-3 text-sm text-destructive">{editError}</p>
              )}
              <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label>Tên đăng nhập *</Label>
                <Input
                  type="text"
                  value={editForm.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((p) => ({ ...p, username: e.target.value }))
                  }
                  required
                  minLength={2}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Tên hiển thị</Label>
                <Input
                  type="text"
                  value={editForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Mật khẩu mới</Label>
                <Input
                  type="password"
                  value={editForm.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="Để trống nếu không đổi"
                />
              </div>

              <div>
                <Select
                  label="Quyền"
                  value={editForm.role}
                  onChange={(v) =>
                    setEditForm((p) => ({
                      ...p,
                      role: v as "ADMIN" | "EDITOR" | "USER",
                    }))
                  }
                  disabled={currentUserId === editingUser.id}
                  options={ROLES.map((r: (typeof ROLES)[number]) => ({
                    value: r.value,
                    label: r.label,
                  }))}
                />
                {currentUserId === editingUser.id && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Không thể đổi quyền của chính mình
                  </p>
                )}
              </div>

              <DialogFooter className="mt-4 flex-wrap gap-2 sm:justify-between">
                <div className="flex gap-2">
                  <Button type="submit" disabled={editSubmitting}>
                    {editSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeEditModal}
                  >
                    Hủy
                  </Button>
                </div>
                {currentUserId !== editingUser.id && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteInModal}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="size-4" />
                    Xóa user
                  </Button>
                )}
              </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
