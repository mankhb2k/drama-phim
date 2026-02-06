import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MovieCard } from "@/components/movie/MovieCard";

interface GenrePageProps {
  params: Promise<{ slug: string }>;
}

export default async function GenrePage({ params }: GenrePageProps) {
  const { slug } = await params;

  const genre = await prisma.genre.findUnique({
    where: { slug },
    include: {
      movies: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { episodes: true } } },
      },
    },
  });

  if (!genre) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Thể loại: {genre.name}
        </h1>
        <p className="mt-1 text-muted-foreground">{genre.movies.length} phim</p>
      </div>

      {genre.movies.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
          Chưa có phim nào thuộc thể loại này.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {genre.movies.map((movie) => (
            <li key={movie.id}>
              <MovieCard
                slug={movie.slug}
                title={movie.title}
                poster={movie.poster}
                year={movie.year}
                episodes={movie._count.episodes}
                status={movie.status}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
