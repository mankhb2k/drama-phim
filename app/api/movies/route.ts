import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  const movieId = Number(params.id);

  if (Number.isNaN(movieId)) {
    return NextResponse.json({ message: "Invalid movie id" }, { status: 400 });
  }

  try {
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        poster: true,
        backdrop: true,
        year: true,
        status: true,
        views: true,
        createdAt: true,
        episodes: {
          orderBy: { episodeNumber: "asc" },
          select: {
            id: true,
            name: true,
            title: true,
            slug: true,
            episodeNumber: true,
            createdAt: true,
          },
        },
      },
    });

    if (!movie) {
      return NextResponse.json({ message: "Movie not found" }, { status: 404 });
    }

    return NextResponse.json(movie);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch movie" },
      { status: 500 },
    );
  }
}
