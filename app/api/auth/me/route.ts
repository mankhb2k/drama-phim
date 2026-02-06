import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/auth/me — Thông tin user đang đăng nhập */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, username: true } as never,
  });

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const u = user as { id: string; username: string; name: string | null; email: string | null };
  return NextResponse.json({
    user: {
      id: u.id,
      username: u.username,
      name: u.name,
      email: u.email,
    },
  });
}
