import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { MovieCard } from "@/components/movie/MovieCard";
import { getCanonicalUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "DramaHD - Phim đang hot",
  description:
    "Xem phim đang hot, được xem nhiều nhất. Cập nhật mỗi ngày tại DramaHD.",
  alternates: getCanonicalUrl("/phim-hot")
    ? { canonical: getCanonicalUrl("/phim-hot") }
    : undefined,
};

const PAGE_SIZE = 24;

export default async function PhimHotPage() {
  const [movies, total] = await Promise.all([
    prisma.movie.findMany({
      orderBy: { views: "desc" },
      take: PAGE_SIZE,
      include: {
        _count: { select: { episodes: true } },
        labels: { select: { name: true, textColor: true, backgroundColor: true } },
      },
    }),
    prisma.movie.count(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Phim đang hot
        </h1>
        <p className="mt-1 text-muted-foreground">
          {total} phim — sắp xếp theo lượt xem
        </p>
      </div>

      {movies.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
          Chưa có phim nào.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {movies.map((movie: (typeof movies)[number]) => (
            <li key={movie.id}>
              <MovieCard
                slug={movie.slug}
                title={movie.title}
                poster={movie.poster}
                year={movie.year}
                episodes={movie._count.episodes}
                status={movie.status}
                labels={movie.labels}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
