import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { watchHistorySchema } from "@/lib/auth-schemas";

/** GET /api/profile/watch-history — Lịch sử xem của user */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const list = await prisma.watchHistory.findMany({
    where: { userId: session.userId },
    orderBy: { lastWatchedAt: "desc" },
    take: 50,
    include: {
      movie: {
        select: {
          id: true,
          slug: true,
          title: true,
          poster: true,
          year: true,
          status: true,
          _count: { select: { episodes: true } },
        },
      },
    },
  });

  const items = list.map((h) => ({
    id: h.id,
    movieId: h.movieId,
    episodeId: h.episodeId,
    progressSeconds: h.progressSeconds,
    lastWatchedAt: h.lastWatchedAt.toISOString(),
    movie: {
      ...h.movie,
      episodes: h.movie._count.episodes,
      _count: undefined,
    },
  }));

  return NextResponse.json({ items });
}

/** POST /api/profile/watch-history — Cập nhật / thêm lịch sử xem */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = watchHistorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { movieId, episodeId, progressSeconds } = parsed.data;

  const movie = await prisma.movie.findUnique({ where: { id: movieId } });
  if (!movie) {
    return NextResponse.json({ error: "Phim không tồn tại" }, { status: 404 });
  }

  const updated = await prisma.watchHistory.upsert({
    where: {
      userId_movieId: { userId: session.userId, movieId },
    },
    create: {
      userId: session.userId,
      movieId,
      episodeId: episodeId ?? null,
      progressSeconds: progressSeconds ?? 0,
    },
    update: {
      episodeId: episodeId ?? undefined,
      progressSeconds: progressSeconds ?? undefined,
      lastWatchedAt: new Date(),
    },
    include: {
      movie: {
        select: {
          id: true,
          slug: true,
          title: true,
          poster: true,
          year: true,
          status: true,
          _count: { select: { episodes: true } },
        },
      },
    },
  });

  return NextResponse.json({
    id: updated.id,
    movieId: updated.movieId,
    episodeId: updated.episodeId,
    progressSeconds: updated.progressSeconds,
    lastWatchedAt: updated.lastWatchedAt.toISOString(),
    movie: {
      ...updated.movie,
      episodes: updated.movie._count.episodes,
      _count: undefined,
    },
  });
}
