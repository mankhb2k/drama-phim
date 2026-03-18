import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CHANNEL_SLUG } from "@/lib/channel";

const channelSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug không được để trống")
    .max(50, "Slug tối đa 50 ký tự")
    .regex(/^[a-z0-9-]+$/, "Chỉ dùng chữ thường, số và dấu gạch ngang (-)"),
  name: z
    .string()
    .min(1, "Tên không được để trống")
    .max(100, "Tên tối đa 100 ký tự")
    .optional()
    .default(""),
});

/** GET /api/dashboard/channels — Danh sách channel (slug + name + số phim) */
export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await prisma.channel.upsert({
      where: { slug: DEFAULT_CHANNEL_SLUG },
      create: {
        slug: DEFAULT_CHANNEL_SLUG,
        name: "DramaHD",
      },
      update: {},
    });
    const channels = await prisma.channel.findMany({
      orderBy: { slug: "asc" },
      select: { id: true, slug: true, name: true, createdAt: true },
    });
    const movieCounts = await prisma.movie.groupBy({
      by: ["channel"],
      _count: { id: true },
      where: { channel: { in: channels.map((c: { slug: string }) => c.slug) } },
    });
    const countMap = new Map(
      movieCounts.map((m: { channel: string; _count: { id: number } }) => [
        m.channel,
        m._count.id,
      ]),
    );
    const items = channels.map((c: (typeof channels)[number]) => ({
      ...c,
      movieCount: countMap.get(c.slug) ?? 0,
    }));
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[GET /api/dashboard/channels]", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy danh sách channel" },
      { status: 500 },
    );
  }
}

/** POST /api/dashboard/channels — Tạo channel mới */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const parsed = channelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;
    const slug = data.slug.trim();
    const name = (data.name ?? "").trim() || slug.toUpperCase();

    const existing = await prisma.channel.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: `Channel "${slug}" đã tồn tại` },
        { status: 409 },
      );
    }

    const channel = await prisma.channel.create({
      data: { slug, name },
      select: { id: true, slug: true, name: true, createdAt: true },
    });
    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error("[POST /api/dashboard/channels]", error);
    return NextResponse.json(
      { error: "Lỗi khi tạo channel mới" },
      { status: 500 },
    );
  }
}

