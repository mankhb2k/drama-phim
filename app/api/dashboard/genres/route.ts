import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/dashboard/genres — Danh sách thể loại (cho form thêm phim) */
export async function GET() {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { order: "asc" },
      select: { id: true, slug: true, name: true },
    });
    return NextResponse.json(genres);
  } catch (error) {
    console.error("[GET /api/dashboard/genres]", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy danh sách thể loại" },
      { status: 500 }
    );
  }
}
