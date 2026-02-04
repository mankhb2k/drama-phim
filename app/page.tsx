import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { MovieCard } from "@/components/movie/MovieCard";
import { MovieCardHero } from "@/components/movie/MovieCardHero";
import { Button } from "@/components/ui/button";

// Mock data - thay bằng data từ Prisma/API sau
const featuredMovie = {
  slug: "trum-quy-duong",
  title: "Trùm Quỷ Dương",
  description:
    "Câu chuyện về một gia tộc tội phạm quyền lực và những âm mưu chồng chất trong thế giới ngầm.",
  backdrop: null,
  year: 2024,
  episodes: 16,
};

const trendingMovies = [
  {
    slug: "tu-than",
    title: "Tử Thần",
    year: 2024,
    episodes: 20,
    status: "ONGOING" as const,
  },
  {
    slug: "hon-ma",
    title: "Hồn Ma",
    year: 2024,
    episodes: 16,
    status: "COMPLETED" as const,
  },
  {
    slug: "chiec-bong",
    title: "Chiếc Bóng",
    year: 2023,
    episodes: 24,
    status: "COMPLETED" as const,
  },
  {
    slug: "bong-toi",
    title: "Bóng Tối",
    year: 2024,
    episodes: 12,
    status: "ONGOING" as const,
  },
  {
    slug: "dem-dai",
    title: "Đêm Dài",
    year: 2023,
    episodes: 18,
    status: "COMPLETED" as const,
  },
];

const newUpdates = [
  {
    slug: "nu-hon",
    title: "Nụ Hôn Định Mệnh",
    year: 2024,
    episodes: 8,
    status: "ONGOING" as const,
  },
  {
    slug: "song-sinh",
    title: "Song Sinh",
    year: 2024,
    episodes: 6,
    status: "ONGOING" as const,
  },
  {
    slug: "ao-anh",
    title: "Ảo Ảnh",
    year: 2024,
    episodes: 10,
    status: "ONGOING" as const,
  },
  {
    slug: "gio-mua",
    title: "Gió Mùa",
    year: 2024,
    episodes: 4,
    status: "ONGOING" as const,
  },
  {
    slug: "canh-bac",
    title: "Cánh Bắc",
    year: 2023,
    episodes: 16,
    status: "COMPLETED" as const,
  },
];

const popularCompleted = [
  {
    slug: "hai-phuong",
    title: "Hai Phương",
    year: 2023,
    episodes: 32,
    status: "COMPLETED" as const,
  },
  {
    slug: "gioi-han",
    title: "Giới Hạn",
    year: 2023,
    episodes: 24,
    status: "COMPLETED" as const,
  },
  {
    slug: "tinh-yeu",
    title: "Tình Yêu Và Thù Hận",
    year: 2022,
    episodes: 40,
    status: "COMPLETED" as const,
  },
  {
    slug: "bach-duong",
    title: "Bạch Dương",
    year: 2023,
    episodes: 20,
    status: "COMPLETED" as const,
  },
  {
    slug: "hoang-hon",
    title: "Hoàng Hôn",
    year: 2022,
    episodes: 28,
    status: "COMPLETED" as const,
  },
];

function SectionHeader({
  title,
  href,
}: {
  title: React.ReactNode;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-lg font-bold text-foreground sm:text-xl">{title}</h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          Xem tất cả
          <ChevronRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

function MovieRow({
  movies,
  variant = "default",
}: {
  movies: Array<{
    slug: string;
    title: string;
    year?: number;
    episodes?: number;
    status?: "ONGOING" | "COMPLETED";
  }>;
  variant?: "default" | "compact";
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible sm:gap-4 scrollbar-hide">
      {movies.map((movie) => (
        <MovieCard
          key={movie.slug}
          slug={movie.slug}
          title={movie.title}
          year={movie.year}
          episodes={movie.episodes}
          status={movie.status}
          variant={variant}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      {/* Hero - Featured Movie */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8">
        <MovieCardHero
          slug={featuredMovie.slug}
          title={featuredMovie.title}
          description={featuredMovie.description}
          backdrop={featuredMovie.backdrop}
          year={featuredMovie.year}
          episodes={featuredMovie.episodes}
        />
      </section>

      {/* Trending */}
      <section>
        <SectionHeader
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="size-5 text-amber-500" />
              Đang hot
            </span>
          }
          href="/phim-bo?sort=trending"
        />
        <div className="mt-4">
          <MovieRow movies={trendingMovies} />
        </div>
      </section>

      {/* New Updates */}
      <section>
        <SectionHeader title="Mới cập nhật" href="/phim-bo?sort=latest" />
        <div className="mt-4">
          <MovieRow movies={newUpdates} />
        </div>
      </section>

      {/* Popular Completed */}
      <section>
        <SectionHeader title="Đã hoàn thành" href="/phim-bo?status=completed" />
        <div className="mt-4">
          <MovieRow movies={popularCompleted} />
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-muted/50 p-6 text-center sm:p-8">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          Không tìm thấy phim bạn muốn?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Gửi yêu cầu phim và chúng tôi sẽ cập nhật sớm nhất
        </p>
        <Button asChild className="mt-4" size="lg">
          <Link href="/lien-he">Gửi yêu cầu</Link>
        </Button>
      </section>
    </div>
  );
}
