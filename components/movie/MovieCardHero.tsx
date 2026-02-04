import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

export interface MovieCardHeroProps {
  slug: string;
  title: string;
  description?: string | null;
  backdrop?: string | null;
  year?: number | null;
  episodes?: number;
}

const placeholderBackdrop =
  "linear-gradient(135deg, oklch(0.35 0.04 264) 0%, oklch(0.2 0.05 280) 100%)";

export function MovieCardHero({
  slug,
  title,
  description,
  backdrop,
  year,
  episodes,
}: MovieCardHeroProps) {
  const backdropUrl = backdrop || undefined;

  return (
    <Link href={`/movies/${slug}`} className="group block">
      <div className="relative aspect-[16/9] min-h-[200px] overflow-hidden rounded-2xl sm:aspect-[21/9] sm:min-h-[280px] md:min-h-[320px]">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={title}
            fill
            sizes="100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
          />
        ) : (
          <div
            className="size-full"
            style={{ background: placeholderBackdrop }}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-8">
          <h2 className="text-xl font-bold leading-tight text-white drop-shadow-lg sm:text-2xl md:text-3xl lg:text-4xl">
            {title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/90">
            {year && <span>{year}</span>}
            {episodes !== undefined && episodes > 0 && (
              <span className="flex items-center gap-1">
                <span className="size-1 rounded-full bg-white/80" />
                {episodes} tập
              </span>
            )}
          </div>
          {description && (
            <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-white/80 sm:text-base">
              {description}
            </p>
          )}
          <div className="mt-4 flex items-center gap-2 text-white">
            <span className="flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors group-hover:bg-white/30 sm:size-12">
              <Play className="size-5 fill-current pl-0.5 sm:size-6" />
            </span>
            <span className="text-sm font-medium">Xem ngay</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
