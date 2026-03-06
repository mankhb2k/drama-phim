"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildWatchHref } from "@/lib/watch-slug";

export interface EpisodeSwitcherProps {
  movieSlug: string;
  movieTitle: string;
  currentEpisodeNumber: number;
  channel?: string;
  episodes: Array<{ episodeNumber: number; name: string; episodeSlug?: string }>;
  className?: string;
}

export function EpisodeSwitcher({
  movieSlug,
  movieTitle,
  currentEpisodeNumber,
  channel = "nsh",
  episodes,
  className,
}: EpisodeSwitcherProps) {
  const currentIndex = episodes.findIndex(
    (ep) => ep.episodeNumber === currentEpisodeNumber
  );
  const prevEp = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEp =
    currentIndex >= 0 && currentIndex < episodes.length - 1
      ? episodes[currentIndex + 1]
      : null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          {prevEp ? (
            <Link
              href={buildWatchHref(
                movieSlug,
                prevEp.episodeNumber,
                channel,
                prevEp.episodeSlug,
              )}
              className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <ChevronLeft className="size-4" />
              Tập trước
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              <ChevronLeft className="size-4" />
              Tập trước
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
            Tập {currentEpisodeNumber}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {nextEp ? (
            <Link
              href={buildWatchHref(
                movieSlug,
                nextEp.episodeNumber,
                channel,
                nextEp.episodeSlug,
              )}
              className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Tập tiếp
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              Tập sau
              <ChevronRight className="size-4" />
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          {movieTitle} — Chọn tập
        </p>
        <div className="grid max-h-[17.5rem] grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
          {episodes.map((ep: (typeof episodes)[number]) => {
            const isActive = ep.episodeNumber === currentEpisodeNumber;
            return (
              <Link
                key={ep.episodeNumber}
                href={buildWatchHref(
                  movieSlug,
                  ep.episodeNumber,
                  channel,
                  ep.episodeSlug,
                )}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-accent"
                )}
              >
                {ep.episodeNumber}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
