import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/movies/[slug]/episodes — Danh sách tập của một phim */
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
      select: { id: true },
    });
    if (!movie) {
      return NextResponse.json(
        { error: "Không tìm thấy phim" },
        { status: 404 }
      );
    }

    const episodes = await prisma.episode.findMany({
      where: { movieId: movie.id },
      orderBy: { episodeNumber: "asc" },
      select: {
        id: true,
        movieId: true,
        name: true,
        episodeNumber: true,
        slug: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ items: episodes, movieId: movie.id });
  } catch (error) {
    console.error("[GET /api/movies/[slug]/episodes]", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy danh sách tập" },
      { status: 500 }
    );
  }
}
