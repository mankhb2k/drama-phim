import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/movies/[slug] — Chi tiết một phim (kèm danh sách tập) */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json({ error: "Thiếu slug" }, { status: 400 });
    }

    const movie = await prisma.movie.findUnique({
      where: { slug },
      include: {
        episodes: {
          orderBy: { episodeNumber: "asc" },
          select: {
            id: true,
            movieId: true,
            name: true,
            episodeNumber: true,
            slug: true,
            createdAt: true,
          },
        },
      },
    });

    if (!movie) {
      return NextResponse.json(
        { error: "Không tìm thấy phim" },
        { status: 404 }
      );
    }

    return NextResponse.json(movie);
  } catch (error) {
    console.error("[GET /api/movies/[slug]]", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy chi tiết phim" },
      { status: 500 }
    );
  }
}
