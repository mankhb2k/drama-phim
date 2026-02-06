import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/dashboard/tags — Danh sách tag (cho form thêm phim) */
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { order: "asc" },
      select: { id: true, slug: true, name: true },
    });
    return NextResponse.json(tags);
  } catch (error) {
    console.error("[GET /api/dashboard/tags]", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy danh sách tag" },
      { status: 500 }
    );
  }
}
