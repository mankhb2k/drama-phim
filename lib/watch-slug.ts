/**
 * URL watch mới (tree): /watch/{channel}/{movieSlug}/{episodeSlug}
 * VD: /watch/nsh/phim-drama1/tap-1
 *
 * URL watch cũ (legacy): /watch/{movieSlug}-tap-{episodeNumber}
 * VD: /watch/phim-drama1-tap-1
 */

const WATCH_SUFFIX_REGEX = /-tap-(\d+)$/;
const EPISODE_SLUG_REGEX = /^tap-(\d+)$/;

export function buildEpisodeSlug(episodeNumber: number): string {
  return `tap-${episodeNumber}`;
}

/** Tạo slug legacy: phim-drama1 + 1 → phim-drama1-tap-1 */
export function buildWatchSlug(movieSlug: string, episodeNumber: number): string {
  return `${movieSlug}-${buildEpisodeSlug(episodeNumber)}`;
}

/** Đường dẫn xem phim dạng tree (chuẩn mới). */
export function buildWatchHrefTree(
  channel: string,
  movieSlug: string,
  episodeSlug: string,
): string {
  return `/watch/${channel}/${movieSlug}/${episodeSlug}`;
}

/** Đường dẫn xem phim mặc định dạng tree, tương thích callsite cũ. */
export function buildWatchHref(
  movieSlug: string,
  episodeNumber: number,
  channel = "nsh",
  episodeSlug?: string,
): string {
  const resolvedEpisodeSlug = episodeSlug ?? buildEpisodeSlug(episodeNumber);
  return buildWatchHrefTree(channel, movieSlug, resolvedEpisodeSlug);
}

/** Parse episodeSlug tree -> episodeNumber */
export function parseEpisodeSlug(episodeSlug: string): number | null {
  const match = episodeSlug.match(EPISODE_SLUG_REGEX);
  if (!match) return null;
  const episodeNumber = parseInt(match[1], 10);
  if (Number.isNaN(episodeNumber) || episodeNumber < 1) return null;
  return episodeNumber;
}

/** Parse slug watch legacy -> movieSlug + episodeNumber */
export function parseLegacyWatchSlug(slug: string): {
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

/** Backward-compatible alias */
export const parseWatchSlug = parseLegacyWatchSlug;
