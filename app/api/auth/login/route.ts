import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/auth-schemas";
import { signToken, getCookieName, getCookieMaxAge } from "@/lib/auth";

/** POST /api/auth/login */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;
    const loginValue = username?.trim();
    if (!loginValue) {
      return NextResponse.json(
        { error: "Phải có username hoặc email" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: loginValue }, { email: loginValue }],
      } as never,
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" }, { status: 401 });
    }

    const u = user as unknown as {
      id: string;
      username: string;
      name: string | null;
      email: string | null;
      role: "ADMIN" | "EDITOR" | "USER";
    };
    const token = await signToken({
      userId: u.id,
      username: u.username,
      role: u.role,
    });
    const res = NextResponse.json({
      user: {
        id: u.id,
        username: u.username,
        name: u.name,
        email: u.email,
      },
    });
    res.cookies.set(getCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: getCookieMaxAge(),
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Lỗi đăng nhập" }, { status: 500 });
  }
}
