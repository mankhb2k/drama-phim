import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { favoriteSchema } from "@/lib/auth-schemas";

/** GET /api/profile/favorites — Danh sách phim yêu thích */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const list = await prisma.favorite.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
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

  const items = list.map((f) => ({
    id: f.id,
    movieId: f.movieId,
    createdAt: f.createdAt.toISOString(),
    movie: {
      ...f.movie,
      episodes: f.movie._count.episodes,
      _count: undefined,
    },
  }));

  return NextResponse.json({ items });
}

/** POST /api/profile/favorites — Thêm hoặc bỏ yêu thích (toggle) */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = favoriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { movieId } = parsed.data;

  const movie = await prisma.movie.findUnique({ where: { id: movieId } });
  if (!movie) {
    return NextResponse.json({ error: "Phim không tồn tại" }, { status: 404 });
  }

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_movieId: { userId: session.userId, movieId },
    },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { id: existing.id },
    });
    return NextResponse.json({ added: false, message: "Đã bỏ khỏi yêu thích" });
  }

  await prisma.favorite.create({
    data: { userId: session.userId, movieId },
  });
  return NextResponse.json({ added: true, message: "Đã thêm vào yêu thích" });
}
