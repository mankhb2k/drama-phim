import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CHANNEL_SLUG } from "@/lib/channel";

type Context = { params: Promise<{ slug: string }> };

const deleteQuerySchema = z.object({
  force: z
    .string()
    .optional()
    .transform((v) => v === "1" || v === "true"),
});

const updateChannelSchema = z.object({
  name: z.string().min(1, "Tên không được để trống").max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

/** GET /api/dashboard/channels/[slug] — Chi tiết channel + danh sách phim */
export async function GET(_request: NextRequest, context: Context) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { slug } = await context.params;
    const channel = await prisma.channel.findUnique({ where: { slug } });
    if (!channel) {
      return NextResponse.json(
        { error: "Channel không tồn tại" },
        { status: 404 },
      );
    }
    const movies = await prisma.movie.findMany({
      where: { channel: slug },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        year: true,
        status: true,
        updatedAt: true,
        _count: { select: { episodes: true } },
      },
    });
    return NextResponse.json({
      ...channel,
      movieCount: movies.length,
      movies,
    });
  } catch (error) {
    console.error("[GET /api/dashboard/channels/[slug]]", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy chi tiết channel" },
      { status: 500 },
    );
  }
}

/** PATCH /api/dashboard/channels/[slug] — Cập nhật channel */
export async function PATCH(request: NextRequest, context: Context) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const parsed = updateChannelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const channel = await prisma.channel.findUnique({ where: { slug } });
    if (!channel) {
      return NextResponse.json(
        { error: "Channel không tồn tại" },
        { status: 404 },
      );
    }
    const updates: { name?: string; slug?: string } = {};
    if (parsed.data.name !== undefined)
      updates.name = parsed.data.name.trim();
    if (parsed.data.slug !== undefined) {
      const newSlug = parsed.data.slug.trim();
      if (newSlug !== slug) {
        const conflict = await prisma.channel.findUnique({
          where: { slug: newSlug },
        });
        if (conflict) {
          return NextResponse.json(
            { error: `Slug "${newSlug}" đã tồn tại` },
            { status: 409 },
          );
        }
        await prisma.movie.updateMany({
          where: { channel: slug },
          data: { channel: newSlug },
        });
        updates.slug = newSlug;
      }
    }
    const updated = await prisma.channel.update({
      where: { slug },
      data: updates,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/dashboard/channels/[slug]]", error);
    return NextResponse.json(
      { error: "Lỗi khi cập nhật channel" },
      { status: 500 },
    );
  }
}

/** DELETE /api/dashboard/channels/[slug]?force=1 — Xóa channel */
export async function DELETE(request: NextRequest, context: Context) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json({ error: "Thiếu slug channel" }, { status: 400 });
    }

    const url = new URL(request.url);
    const parsedQuery = deleteQuerySchema.safeParse(
      Object.fromEntries(url.searchParams.entries()),
    );
    const force = parsedQuery.success ? parsedQuery.data.force : false;

    const channel = await prisma.channel.findUnique({ where: { slug } });
    if (!channel) {
      return NextResponse.json(
        { error: "Channel không tồn tại" },
        { status: 404 },
      );
    }

    const movieCount = await prisma.movie.count({ where: { channel: slug } });
    if (movieCount > 0 && !force) {
      return NextResponse.json(
        {
          error:
            "Không thể xóa channel vì vẫn còn phim đang dùng. Hãy chuyển channel của phim khác trước, hoặc gọi lại với force=1.",
          movieCount,
        },
        { status: 400 },
      );
    }

    if (movieCount > 0 && force) {
      await prisma.movie.updateMany({
        where: { channel: slug },
        data: { channel: DEFAULT_CHANNEL_SLUG },
      });
    }

    await prisma.channel.delete({ where: { slug } });

    return NextResponse.json({ success: true, reassignedMovies: movieCount });
  } catch (error) {
    console.error("[DELETE /api/dashboard/channels/[slug]]", error);
    return NextResponse.json(
      { error: "Lỗi khi xóa channel" },
      { status: 500 },
    );
  }
}

