import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/episodes/[episodeId]/servers — Danh sách server của một tập */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ episodeId: string }> }
) {
  try {
    const { episodeId: episodeIdStr } = await context.params;
    const episodeId = parseInt(episodeIdStr, 10);

    if (Number.isNaN(episodeId) || episodeId < 1) {
      return NextResponse.json(
        { error: "episodeId không hợp lệ" },
        { status: 400 }
      );
    }

    const servers = await prisma.server.findMany({
      where: { episodeId, isActive: true },
      orderBy: { priority: "asc" },
      select: {
        id: true,
        episodeId: true,
        name: true,
        embedUrl: true,
        priority: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ items: servers, episodeId });
  } catch (error) {
    console.error("[GET /api/episodes/[episodeId]/servers]", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy danh sách server" },
      { status: 500 }
    );
  }
}
