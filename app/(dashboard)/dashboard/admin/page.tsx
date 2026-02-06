import Link from "next/link";
import { Film, FolderOpen, Tags, PlusCircle, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default async function DashboardOverviewPage() {
  const tagCountPromise =
    "tag" in prisma &&
    typeof (prisma as { tag?: { count: () => Promise<number> } }).tag?.count ===
      "function"
      ? (prisma as { tag: { count: () => Promise<number> } }).tag.count()
      : Promise.resolve(0);

  const results = await Promise.allSettled([
    prisma.movie.count(),
    prisma.genre.count(),
    tagCountPromise,
    prisma.episode.count(),
  ]);
  const movieCount = results[0].status === "fulfilled" ? results[0].value : 0;
  const genreCount = results[1].status === "fulfilled" ? results[1].value : 0;
  const tagCount = results[2].status === "fulfilled" ? results[2].value : 0;
  const episodeCount = results[3].status === "fulfilled" ? results[3].value : 0;

  const cards = [
    {
      title: "Phim",
      value: movieCount,
      href: "/dashboard/admin/movies",
      icon: Film,
      desc: "Quản lý danh sách phim",
    },
    {
      title: "Thể loại",
      value: genreCount,
      href: "/dashboard/admin/genres",
      icon: FolderOpen,
      desc: "Quản lý thể loại",
    },
    {
      title: "Tag",
      value: tagCount,
      href: "/dashboard/admin/tags",
      icon: Tags,
      desc: "Quản lý tag",
    },
    {
      title: "Tổng số tập",
      value: episodeCount,
      href: "/dashboard/admin/movies",
      icon: Film,
      desc: "Tổng tập phim",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Tổng quan
        </h1>
        <p className="text-muted-foreground">
          Quản lý nội dung phim, thể loại và tag.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href + card.title}
              href={card.href}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </span>
                <Icon className="size-5 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.desc}</p>
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">
          Thao tác nhanh
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link
              href="/dashboard/admin/movies/new"
              className="inline-flex items-center gap-2"
            >
              <PlusCircle className="size-4" />
              Thêm phim mới
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link
              href="/dashboard/admin/movies"
              className="inline-flex items-center gap-2"
            >
              Xem danh sách phim
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
