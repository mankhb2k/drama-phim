import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MovieCardProps {
  slug: string;
  title: string;
  poster?: string | null;
  year?: number | null;
  episodes?: number;
  status?: "ONGOING" | "COMPLETED";
  className?: string;
  variant?: "default" | "compact";
}

const placeholderPoster =
  "linear-gradient(135deg, oklch(0.45 0.02 264) 0%, oklch(0.25 0.03 280) 100%)";

export function MovieCard({
  slug,
  title,
  poster,
  year,
  episodes,
  status,
  className,
  variant = "default",
}: MovieCardProps) {
  const posterUrl = poster || undefined;

  return (
    <Link
      href={`/movies/${slug}`}
      className={cn(
        "group block shrink-0 transition-transform active:scale-[0.98]",
        variant === "default" && "w-[140px] sm:w-[160px]",
        variant === "compact" && "w-[120px] sm:w-[140px]",
        className
      )}
    >
      {/* Poster */}
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-muted",
          variant === "default" && "aspect-[2/3]",
          variant === "compact" && "aspect-[2/3]"
        )}
      >
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 140px, 160px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="size-full"
            style={{ background: placeholderPoster }}
          />
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="flex size-12 items-center justify-center rounded-full bg-white/90 text-black">
            <Play className="size-6 fill-current pl-0.5" />
          </span>
        </div>

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {status === "ONGOING" && (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-amber-500/90 text-white">
              Đang chiếu
            </span>
          )}
          {episodes !== undefined && episodes > 0 && (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-black/60 text-white backdrop-blur-sm">
              {episodes} tập
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-2 space-y-0.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground group-hover:text-primary">
          {title}
        </h3>
        {year && <p className="text-xs text-muted-foreground">{year}</p>}
      </div>
    </Link>
  );
}
