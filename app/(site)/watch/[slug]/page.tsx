import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMockMovieBySlug,
  getMockPrimaryServer,
  type MockEpisode,
  type MockServer,
} from "@/lib/mock-data";
import { parseWatchSlug, buildWatchHref } from "@/lib/watch-slug";
import { EpisodeSwitcher } from "@/components/watch/EpisodeSwitcher";
import { ArrowLeft } from "lucide-react";

interface WatchPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { slug } = await params;

  const parsed = parseWatchSlug(slug);
  if (!parsed) notFound();

  const { movieSlug, episodeNumber } = parsed;

  const movie = getMockMovieBySlug(movieSlug);
  if (!movie) notFound();

  const currentEpisode = movie.episodes.find(
    (ep: MockEpisode) => ep.episodeNumber === episodeNumber
  );
  if (!currentEpisode) notFound();

  const primaryServer = getMockPrimaryServer(movie, episodeNumber);
  const otherServers = currentEpisode.servers.filter(
    (s: MockServer) => s.id !== primaryServer?.id
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

      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        {primaryServer?.embedUrl ? (
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
        episodes={movie.episodes.map((ep: MockEpisode) => ({
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
            {otherServers.map((server: MockServer) => (
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
