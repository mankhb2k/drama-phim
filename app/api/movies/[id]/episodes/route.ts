import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  const movieId = Number(params.id);

  if (Number.isNaN(movieId)) {
    return NextResponse.json({ message: "Invalid movie id" }, { status: 400 });
  }

  try {
    const episodes = await prisma.episode.findMany({
      where: { movieId },
      orderBy: { episodeNumber: "asc" },
      select: {
        id: true,
        name: true,
        title: true,
        slug: true,
        episodeNumber: true,
        createdAt: true,
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
