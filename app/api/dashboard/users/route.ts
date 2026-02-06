import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createUserSchema = z.object({
  username: z.string().min(2).max(32),
  password: z.string().min(6),
  name: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  role: z.enum(["ADMIN", "EDITOR", "USER"]),
});

/** GET /api/dashboard/users — Danh sách user (chỉ ADMIN) */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("[GET /api/dashboard/users]", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy danh sách user" },
      { status: 500 }
    );
  }
}

/** POST /api/dashboard/users — Tạo user mới (chỉ ADMIN) */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { username, password, name, email, role } = parsed.data;
    const emailVal = email && email.trim() !== "" ? email.trim() : null;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.trim() },
          ...(emailVal ? [{ email: emailVal }] : []),
        ],
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: existing.username === username.trim() ? "Tên đăng nhập đã tồn tại" : "Email đã được sử dụng" },
        { status: 409 }
      );
    }

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: emailVal,
        name: name?.trim() || null,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[POST /api/dashboard/users]", error);
    return NextResponse.json(
      { error: "Lỗi khi tạo user" },
      { status: 500 }
    );
  }
}
