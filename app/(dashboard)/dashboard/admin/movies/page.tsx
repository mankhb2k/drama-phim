import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PlusCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DashboardMoviesPage() {
  const movies = await prisma.movie.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { episodes: true } },
      genres: { select: { name: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Danh sách phim
          </h1>
          <p className="text-muted-foreground">{movies.length} phim</p>
        </div>
        <Button asChild>
          <Link
            href="/dashboard/admin/movies/new"
            className="inline-flex items-center gap-2"
          >
            <PlusCircle className="size-4" />
            Thêm phim
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 font-medium text-foreground">
                  Tiêu đề
                </th>
                <th className="px-4 py-3 font-medium text-foreground">Slug</th>
                <th className="px-4 py-3 font-medium text-foreground">
                  Trạng thái
                </th>
                <th className="px-4 py-3 font-medium text-foreground">Tập</th>
                <th className="px-4 py-3 font-medium text-foreground">
                  Thể loại
                </th>
                <th className="px-4 py-3 font-medium text-foreground">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {movies.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Chưa có phim nào.
                  </td>
                </tr>
              ) : (
                movies.map((movie) => (
                  <tr
                    key={movie.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {movie.title}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {movie.slug}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          movie.status === "ONGOING"
                            ? "rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400"
                            : "rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                        }
                      >
                        {movie.status === "ONGOING"
                          ? "Đang chiếu"
                          : "Hoàn thành"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {movie._count.episodes}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {movie.genres.map((g) => g.name).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/dashboard/admin/movies/${movie.slug}/edit`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
                        >
                          <Pencil className="size-4" />
                          Sửa
                        </Link>
                        <Link
                          href={`/movies/${movie.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Xem
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
