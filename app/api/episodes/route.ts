import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const episodes = await prisma.episode.findMany({
      orderBy: [{ movieId: "asc" }, { episodeNumber: "asc" }],
      select: {
        id: true,
        episodeNumber: true,
        movieId: true,
      },
    });

    return NextResponse.json(episodes);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch episodes" },
      { status: 500 },
    );
  }
}
