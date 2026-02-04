/**
 * URL watch: /watch/{movieSlug}-tap-{episodeNumber}
 * VD: /watch/phim-drama1-tap-1, /watch/phim-drama1-tap-2
 */

const WATCH_SUFFIX_REGEX = /-tap-(\d+)$/;

/** Tạo slug xem phim: phim-drama1 + 1 → phim-drama1-tap-1 */
export function buildWatchSlug(
  movieSlug: string,
  episodeNumber: number
): string {
  return `${movieSlug}-tap-${episodeNumber}`;
}

/** Đường dẫn xem phim (dùng trong Link href). */
export function buildWatchHref(
  movieSlug: string,
  episodeNumber: number
): string {
  return `/watch/${buildWatchSlug(movieSlug, episodeNumber)}`;
}

/** Parse slug watch → movieSlug + episodeNumber. Trả về null nếu không đúng format. */
export function parseWatchSlug(slug: string): {
  movieSlug: string;
  episodeNumber: number;
} | null {
  const match = slug.match(WATCH_SUFFIX_REGEX);
  if (!match) return null;
  const episodeNumber = parseInt(match[1], 10);
  if (Number.isNaN(episodeNumber) || episodeNumber < 1) return null;
  const movieSlug = slug.replace(WATCH_SUFFIX_REGEX, "");
  if (!movieSlug) return null;
  return { movieSlug, episodeNumber };
}
