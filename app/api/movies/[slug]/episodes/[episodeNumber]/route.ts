import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/movies/[slug]/episodes/[episodeNumber] — Một tập kèm thông tin phim và servers */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string; episodeNumber: string }> }
) {
  try {
    const { slug, episodeNumber: episodeNumberStr } = await context.params;
    const episodeNumber = parseInt(episodeNumberStr, 10);

    if (!slug || Number.isNaN(episodeNumber) || episodeNumber < 1) {
      return NextResponse.json(
        { error: "Thiếu slug hoặc episodeNumber không hợp lệ" },
        { status: 400 }
      );
    }

    const movie = await prisma.movie.findUnique({
      where: { slug },
      include: {
        episodes: {
          where: { episodeNumber },
          take: 1,
          include: {
            servers: {
              where: { isActive: true },
              orderBy: { priority: "asc" },
              select: {
                id: true,
                episodeId: true,
                name: true,
                embedUrl: true,
                priority: true,
                isActive: true,
              },
            },
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

    const episode = movie.episodes[0];
    if (!episode) {
      return NextResponse.json(
        { error: "Không tìm thấy tập này" },
        { status: 404 }
      );
    }

    const { episodes: _ep, ...movieInfo } = movie;
    return NextResponse.json({
      movie: movieInfo,
      episode: {
        id: episode.id,
        movieId: episode.movieId,
        name: episode.name,
        episodeNumber: episode.episodeNumber,
        slug: episode.slug,
        createdAt: episode.createdAt,
        servers: episode.servers,
      },
    });
  } catch (error) {
    console.error("[GET /api/movies/[slug]/episodes/[episodeNumber]]", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy thông tin tập" },
      { status: 500 }
    );
  }
}
