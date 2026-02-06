import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateUserSchema = z.object({
  username: z.string().min(2).max(32).optional(),
  name: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(6).optional().or(z.literal("")),
  role: z.enum(["ADMIN", "EDITOR", "USER"]).optional(),
});

/** PATCH /api/dashboard/users/[id] — Cập nhật thông tin / quyền (chỉ ADMIN) */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy user" }, { status: 404 });
    }

    const isSelf = user.id === session.userId;
    const data = parsed.data;

    if (data.username !== undefined) {
      const username = data.username.trim();
      const existing = await prisma.user.findFirst({
        where: { username, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Tên đăng nhập đã tồn tại" },
          { status: 409 }
        );
      }
    }
    if (data.email !== undefined && data.email !== "") {
      const email = data.email.trim();
      const existing = await prisma.user.findFirst({
        where: { email, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Email đã được sử dụng" },
          { status: 409 }
        );
      }
    }

    if (isSelf && data.role !== undefined && data.role !== user.role) {
      return NextResponse.json(
        { error: "Không thể thay đổi quyền của chính mình" },
        { status: 400 }
      );
    }

    const bcrypt = await import("bcryptjs");
    const updateData: {
      username?: string;
      name?: string | null;
      email?: string | null;
      password?: string;
      role?: "ADMIN" | "EDITOR" | "USER";
    } = {};
    if (data.username !== undefined) updateData.username = data.username.trim();
    if (data.name !== undefined) updateData.name = data.name.trim() || null;
    if (data.email !== undefined)
      updateData.email = data.email.trim() || null;
    if (data.password !== undefined && data.password !== "")
      updateData.password = await bcrypt.hash(data.password, 10);
    if (data.role !== undefined) updateData.role = data.role;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/dashboard/users/[id]]", error);
    return NextResponse.json(
      { error: "Lỗi khi cập nhật user" },
      { status: 500 }
    );
  }
}

/** DELETE /api/dashboard/users/[id] — Xóa user (chỉ ADMIN) */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
  }

  if (id === session.userId) {
    return NextResponse.json(
      { error: "Không thể xóa chính tài khoản đang đăng nhập" },
      { status: 400 }
    );
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/dashboard/users/[id]]", error);
    return NextResponse.json(
      { error: "Lỗi khi xóa user" },
      { status: 500 }
    );
  }
}
