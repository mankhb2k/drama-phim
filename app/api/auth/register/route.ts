import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/auth-schemas";
import { signToken, getCookieName, getCookieMaxAge } from "@/lib/auth";

/** POST /api/auth/register — Đăng ký, không cần verify mail */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten();
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: errors.fieldErrors },
        { status: 400 }
      );
    }

    const { username, password, name, email } = parsed.data;
    const usernameVal = (username ?? "").trim();
    const emailValue = (email ?? "").trim() || null;

    if (!usernameVal && !emailValue) {
      return NextResponse.json(
        { error: "Phải có username hoặc email" },
        { status: 400 }
      );
    }

    const loginId: string = (usernameVal || emailValue) ?? "";
    if (!loginId) {
      return NextResponse.json(
        { error: "Phải có username hoặc email" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          ...(usernameVal ? [{ username: usernameVal }] : []),
          ...(emailValue ? [{ email: emailValue }] : []),
        ],
      } as never,
    });
    const existingUser = existing as { username: string; email: string | null } | null;
    if (existingUser) {
      const isUsernameTaken = existingUser.username === usernameVal;
      return NextResponse.json(
        {
          error: isUsernameTaken
            ? "Tên đăng nhập đã được sử dụng"
            : "Email đã được sử dụng",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username: loginId,
        email: emailValue,
        password: hashedPassword,
        name: name?.trim() || null,
      } as never,
      select: { id: true, username: true, name: true, email: true } as never,
    });

    const u = user as { id: string; username: string; name: string | null; email: string | null };
    const token = await signToken({
      userId: u.id,
      username: u.username,
      role: "USER",
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
    console.error("Register error:", e);
    return NextResponse.json({ error: "Lỗi đăng ký" }, { status: 500 });
  }
}
