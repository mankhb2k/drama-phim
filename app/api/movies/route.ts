import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/movies — Danh sách phim (query: status?, limit?, offset?, orderBy?, labelSlug?) */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const labelSlug = searchParams.get("labelSlug")?.trim();
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
    const offset = Number(searchParams.get("offset")) || 0;
    const orderByParam = searchParams.get("orderBy") ?? "updatedAt";

    const where: { status?: "ONGOING" | "COMPLETED"; labels?: { some: { slug: string } } } = {};
    if (status === "ONGOING" || status === "COMPLETED") where.status = status;
    if (labelSlug) where.labels = { some: { slug: labelSlug } };

    const orderBy =
      orderByParam === "views"
        ? { views: "desc" as const }
        : orderByParam === "createdAt"
          ? { createdAt: "desc" as const }
          : { updatedAt: "desc" as const };

    const [movies, total] = await Promise.all([
      prisma.movie.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        select: {
          id: true,
          slug: true,
          title: true,
          originalTitle: true,
          poster: true,
          backdrop: true,
          year: true,
          status: true,
          views: true,
          _count: { select: { episodes: true } },
          labels: { select: { name: true, textColor: true, backgroundColor: true } },
        },
      }),
      prisma.movie.count({ where }),
    ]);

    const items = movies.map((m: (typeof movies)[number]) => ({
      ...m,
      episodes: m._count.episodes,
      labels: m.labels,
      _count: undefined,
    }));

    return NextResponse.json({
      items,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[GET /api/movies]", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy danh sách phim" },
      { status: 500 }
    );
  }
}
