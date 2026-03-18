import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { getBaseUrl, getCanonicalUrl } from "@/lib/site-url";
import { prisma } from "@/lib/prisma";

const SITE_DESCRIPTION =
  "Xem phim online miễn phí, chất lượng cao. Phim bộ, phim lẻ, hoạt hình mới cập nhật mỗi ngày.";
const baseUrl = getBaseUrl() || "https://dramahd.net";
const homeUrl = getCanonicalUrl("/") ?? `${baseUrl.replace(/\/$/, "")}`;
const ogImageUrl = `${baseUrl.replace(/\/$/, "")}/drama-logo.png`;

export const metadata: Metadata = {
  title: "DramaHD - Trang chủ",
  description: SITE_DESCRIPTION,
  alternates: getCanonicalUrl("/") ? { canonical: getCanonicalUrl("/") } : undefined,
  openGraph: {
    title: "DramaHD - Trang chủ",
    description: SITE_DESCRIPTION,
    url: homeUrl,
    siteName: "DramaHD",
    type: "website",
    images: [{ url: ogImageUrl, alt: "DramaHD" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DramaHD - Trang chủ",
    description: SITE_DESCRIPTION,
  },
};
import { MovieCard } from "@/components/movie/MovieCard";
import { MovieCardHero } from "@/components/movie/MovieCardHero";
import { TongHopSection } from "@/components/home/TongHopSection";
import { Button } from "@/components/ui";

const featuredMovie = {
  slug: "trum-quy-duong",
  title: "Trùm Quỷ Dương",
  description:
    "Câu chuyện về một gia tộc tội phạm quyền lực và những âm mưu chồng chất trong thế giới ngầm.",
  backdrop: null,
  year: 2024,
  episodes: 16,
};

/** Slug nhãn cho section Đang hot và Mới cập nhật (tạo trong Dashboard → Tag & Nhãn) */
const LABEL_SLUG_HOT = "hot";
const LABEL_SLUG_MOI = "moi";

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

type MovieRowItem = {
  slug: string;
  title: string;
  poster?: string | null;
  year?: number | null;
  episodes?: number;
  status?: "ONGOING" | "COMPLETED";
  labels?: Array<{ name: string; textColor?: string | null; backgroundColor?: string | null }>;
};

function MovieRow({
  movies,
  variant = "default",
}: {
  movies: MovieRowItem[];
  variant?: "default" | "compact";
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible sm:gap-4 scrollbar-hide">
      {movies.map((movie: MovieRowItem) => (
        <MovieCard
          key={movie.slug}
          slug={movie.slug}
          title={movie.title}
          poster={movie.poster}
          year={movie.year}
          episodes={movie.episodes}
          status={movie.status}
          labels={movie.labels}
          variant={variant}
          className="w-[8rem] min-w-[8rem] sm:min-w-0 sm:w-40"
        />
      ))}
    </div>
  );
}

const homePageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "DramaHD",
  url: baseUrl.replace(/\/$/, ""),
  description: SITE_DESCRIPTION,
};

export default async function HomePage() {
  const [hotMovies, newMovies] = await Promise.all([
    prisma.movie.findMany({
      where: { labels: { some: { slug: LABEL_SLUG_HOT } } },
      orderBy: { views: "desc" },
      take: 12,
      select: {
        slug: true,
        title: true,
        poster: true,
        year: true,
        status: true,
        labels: { select: { name: true, textColor: true, backgroundColor: true } },
        _count: { select: { episodes: true } },
      },
    }),
    prisma.movie.findMany({
      where: { labels: { some: { slug: LABEL_SLUG_MOI } } },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: {
        slug: true,
        title: true,
        poster: true,
        year: true,
        status: true,
        labels: { select: { name: true, textColor: true, backgroundColor: true } },
        _count: { select: { episodes: true } },
      },
    }),
  ]);

  const hotRows = hotMovies.map((m: (typeof hotMovies)[number]) => ({
    slug: m.slug,
    title: m.title,
    poster: m.poster,
    year: m.year,
    status: m.status,
    episodes: m._count.episodes,
    labels: m.labels,
  }));
  const newRows = newMovies.map((m: (typeof newMovies)[number]) => ({
    slug: m.slug,
    title: m.title,
    poster: m.poster,
    year: m.year,
    status: m.status,
    episodes: m._count.episodes,
    labels: m.labels,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageJsonLd) }}
      />
      <div className="flex flex-col gap-10 sm:gap-12">
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
      <section>
        <SectionHeader
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="size-5 text-amber-500" />
              Đang hot
            </span>
          }
          href="/phim-hot"
        />
        <div className="mt-4">
          <MovieRow movies={hotRows} />
        </div>
      </section>
      <section>
        <SectionHeader title="Mới cập nhật" href="/phim-moi" />
        <div className="mt-4">
          <MovieRow movies={newRows} />
        </div>
      </section>
      <TongHopSection />
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
    </>
  );
}
