import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  const episodeId = Number(params.id);

  if (Number.isNaN(episodeId)) {
    return NextResponse.json(
      { message: "Invalid episode id" },
      { status: 400 },
    );
  }

  try {
    const episode = await prisma.episode.findUnique({
      where: { id: episodeId },
      select: {
        id: true,
        name: true,
        title: true,
        slug: true,
        episodeNumber: true,
        createdAt: true,
        servers: {
          where: { isActive: true },
          orderBy: { priority: "desc" },
          select: {
            id: true,
            name: true,
            embedUrl: true,
            priority: true,
          },
        },
      },
    });

    if (!episode) {
      return NextResponse.json(
        { message: "Episode not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(episode);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch episode" },
      { status: 500 },
    );
  }
}
