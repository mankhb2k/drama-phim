import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ slug: string }> };

const deleteQuerySchema = z.object({
  force: z
    .string()
    .optional()
    .transform((v) => v === "1" || v === "true"),
});

/** DELETE /api/dashboard/channels/[slug]?force=1 — Xóa channel */
export async function DELETE(request: NextRequest, context: Context) {
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
        data: { channel: "nsh" },
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

