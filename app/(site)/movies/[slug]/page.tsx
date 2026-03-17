import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Play, Calendar, Film } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildWatchHref } from "@/lib/watch-slug";
import { cn, normalizeCoverImageUrl } from "@/lib/utils";
import { FavoriteButton } from "@/components/movie/FavoriteButton";
import { MovieDescription } from "@/components/movie/MovieDescription";
import { getBaseUrl, getCanonicalUrl } from "@/lib/site-url";

const placeholderPoster =
  "linear-gradient(135deg, oklch(0.45 0.02 264) 0%, oklch(0.25 0.03 280) 100%)";

const DEFAULT_DESCRIPTION =
  "Xem phim online miễn phí, chất lượng cao tại DramaHD.";

interface MovieDetailPageProps {
  params: Promise<{ slug: string }>;
}

function toAbsoluteImageUrl(poster: string | null, baseUrl: string): string | undefined {
  if (!poster?.trim()) return undefined;
  if (poster.startsWith("http://") || poster.startsWith("https://")) return poster;
  const base = baseUrl.replace(/\/$/, "");
  return poster.startsWith("/") ? `${base}${poster}` : `${base}/${poster}`;
}

export async function generateMetadata({
  params,
}: MovieDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const movie = await prisma.movie.findUnique({
    where: { slug },
    select: { title: true, description: true, poster: true },
  });
  if (!movie) return {};
  const description =
    movie.description?.trim().slice(0, 160) || DEFAULT_DESCRIPTION;
  const canonical = getCanonicalUrl(`/movies/${slug}`);
  const baseUrl = getBaseUrl() || "https://dramahd.net";
  const ogImage = normalizeCoverImageUrl(toAbsoluteImageUrl(movie.poster, baseUrl) ?? undefined) ?? toAbsoluteImageUrl(movie.poster, baseUrl);
  const pageUrl = canonical ?? `${baseUrl.replace(/\/$/, "")}/movies/${slug}`;

  return {
    title: `DramaHD - ${movie.title}`,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: `DramaHD - ${movie.title}`,
      description,
      url: pageUrl,
      siteName: "DramaHD",
      type: "website",
      ...(ogImage && { images: [{ url: ogImage, alt: movie.title }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: `DramaHD - ${movie.title}`,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function MovieDetailPage({
  params,
}: MovieDetailPageProps) {
  const { slug } = await params;

  const movie = await prisma.movie.findUnique({
    where: { slug },
    include: {
      episodes: {
        orderBy: { episodeNumber: "asc" },
        select: { id: true, episodeNumber: true },
      },
    },
  });
  if (!movie) notFound();

  const firstEpisode = movie.episodes[0];
  const channel = movie.channel || "dramahd";
  const watchHref = firstEpisode
    ? buildWatchHref(
        movie.slug,
        firstEpisode.episodeNumber,
        channel,
        `tap-${firstEpisode.episodeNumber}`,
      )
    : "#";

  const baseUrl = getBaseUrl() || "https://dramahd.net";
  const pageUrl = getCanonicalUrl(`/movies/${slug}`) ?? `${baseUrl.replace(/\/$/, "")}/movies/${slug}`;
  const posterUrl = normalizeCoverImageUrl(toAbsoluteImageUrl(movie.poster, baseUrl) ?? undefined) ?? toAbsoluteImageUrl(movie.poster, baseUrl);
  const movieJsonLd = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: movie.title,
    ...(movie.originalTitle && { alternateName: movie.originalTitle }),
    ...(movie.description && { description: movie.description }),
    ...(posterUrl && { image: posterUrl }),
    url: pageUrl,
    ...(movie.year && { datePublished: String(movie.year) }),
    ...(movie.episodes.length > 0 && { numberOfEpisodes: movie.episodes.length }),
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(movieJsonLd) }}
      />
      <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
        <div className="relative mx-auto aspect-[2/3] w-full max-w-[17.5rem] shrink-0 overflow-hidden rounded-xl bg-muted sm:mx-0 sm:max-w-[15rem]">
          {movie.poster ? (
            <Image
              src={normalizeCoverImageUrl(movie.poster) ?? movie.poster}
              alt={movie.title}
              fill
              sizes="17.5rem"
              className="object-cover"
              priority
              unoptimized
            />
          ) : (
            <div
              className="size-full"
              style={{ background: placeholderPoster }}
            />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {movie.title}
          </h1>
          {movie.originalTitle && (
            <p className="text-sm text-muted-foreground">
              {movie.originalTitle}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {movie.year && (
              <span className="flex items-center gap-1.5">
                <Calendar className="size-4" />
                {movie.year}
              </span>
            )}
            <span
              className={cn(
                "rounded px-2 py-0.5 text-xs font-medium",
                movie.status === "ONGOING"
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {movie.status === "ONGOING" ? "Đang chiếu" : "Hoàn thành"}
            </span>
            {movie.episodes.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Film className="size-4" />
                {movie.episodes.length} tập
              </span>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {firstEpisode && (
                <Link
                  href={watchHref}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Play className="size-5 fill-current" />
                  Xem phim
                </Link>
              )}
            </div>
            {movie.description && (
              <MovieDescription
                text={movie.description}
                maxLength={500}
                className="text-sm leading-relaxed text-muted-foreground sm:text-base"
              />
            )}

            <FavoriteButton slug={slug} />
          </div>
        </div>
      </div>

      {movie.episodes.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            Danh sách tập
          </h2>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3 md:grid-cols-8 lg:grid-cols-10">
            {movie.episodes.map((ep: { id: number; episodeNumber: number }) => (
              <Link
                key={ep.id}
                href={buildWatchHref(
                  movie.slug,
                  ep.episodeNumber,
                  channel,
                  `tap-${ep.episodeNumber}`,
                )}
                className="rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Tập {ep.episodeNumber}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
