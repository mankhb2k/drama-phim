import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseWatchSlug } from "@/lib/watch-slug";
import { EpisodeSwitcher } from "@/components/watch/EpisodeSwitcher";
import { VideoJsPlayer } from "@/components/watch/VideoJsPlayer";
import { ArrowLeft } from "lucide-react";

interface WatchPageProps {
  params: Promise<{ slug: string }>;
}

type ParsedVideoSource = {
  src: string;
  subtitleSrc: string | null;
  subtitleLabel: string;
  subtitleLang: string;
  vastTagUrl: string | null;
};

function isMp4Source(url: string): boolean {
  return /\.mp4($|\?)/i.test(url);
}

function parseVideoSource(rawUrl: string): ParsedVideoSource {
  try {
    const url = new URL(rawUrl);
    const subtitleSrc =
      url.searchParams.get("sub") ?? url.searchParams.get("subtitle");
    const vastTagUrl =
      url.searchParams.get("vast") ?? url.searchParams.get("vastTag");
    const subtitleLabel = url.searchParams.get("subLabel") ?? "Vietnamese";
    const subtitleLang = url.searchParams.get("subLang") ?? "vi";

    url.searchParams.delete("sub");
    url.searchParams.delete("subtitle");
    url.searchParams.delete("vast");
    url.searchParams.delete("vastTag");
    url.searchParams.delete("subLabel");
    url.searchParams.delete("subLang");

    return {
      src: url.toString(),
      subtitleSrc,
      subtitleLabel,
      subtitleLang,
      vastTagUrl,
    };
  } catch {
    return {
      src: rawUrl,
      subtitleSrc: null,
      subtitleLabel: "Vietnamese",
      subtitleLang: "vi",
      vastTagUrl: null,
    };
  }
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { slug } = await params;

  const parsed = parseWatchSlug(slug);
  if (!parsed) notFound();

  const { movieSlug, episodeNumber } = parsed;

  const movie = await prisma.movie.findUnique({
    where: { slug: movieSlug },
    include: {
      episodes: {
        orderBy: { episodeNumber: "asc" },
        include: {
          servers: {
            where: { isActive: true },
            orderBy: { priority: "asc" },
            select: {
              id: true,
              name: true,
              embedUrl: true,
            },
          },
        },
      },
    },
  });
  if (!movie) notFound();

  const currentEpisode = movie.episodes.find(
    (ep: (typeof movie.episodes)[number]) => ep.episodeNumber === episodeNumber
  );
  if (!currentEpisode) notFound();

  const primaryServer = currentEpisode.servers[0];
  const otherServers = currentEpisode.servers.filter(
    (s: (typeof currentEpisode.servers)[number]) => s.id !== primaryServer?.id
  );
  const parsedPrimarySource = primaryServer?.embedUrl
    ? parseVideoSource(primaryServer.embedUrl)
    : null;
  const canUseVideoJs = Boolean(
    parsedPrimarySource && isMp4Source(parsedPrimarySource.src)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/movies/${movie.slug}`}
          className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          {movie.title}
        </Link>
        <span aria-hidden>/</span>
        <span>
          Tập {currentEpisode.episodeNumber}
          {currentEpisode.name ? ` — ${currentEpisode.name}` : ""}
        </span>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-3xl overflow-hidden rounded-xl bg-black">
        {canUseVideoJs && parsedPrimarySource ? (
          <VideoJsPlayer
            src={parsedPrimarySource.src}
            subtitleSrc={parsedPrimarySource.subtitleSrc}
            subtitleLabel={parsedPrimarySource.subtitleLabel}
            subtitleLang={parsedPrimarySource.subtitleLang}
            vastTagUrl={parsedPrimarySource.vastTagUrl}
          />
        ) : primaryServer?.embedUrl ? (
          <iframe
            src={primaryServer.embedUrl}
            title={`${movie.title} - Tập ${currentEpisode.episodeNumber}`}
            className="absolute inset-0 size-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            Chưa có link xem cho tập này.
          </div>
        )}
      </div>

      <EpisodeSwitcher
        movieSlug={movie.slug}
        movieTitle={movie.title}
        currentEpisodeNumber={currentEpisode.episodeNumber}
        episodes={movie.episodes.map((ep: (typeof movie.episodes)[number]) => ({
          episodeNumber: ep.episodeNumber,
          name: ep.name,
        }))}
      />

      {otherServers.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Server khác
          </p>
          <ul className="flex flex-wrap gap-2">
            {otherServers.map((server: (typeof otherServers)[number]) => (
              <li key={server.id}>
                <a
                  href={server.embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {server.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
