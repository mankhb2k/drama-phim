/**
 * Slug channel mặc định khi phim không chọn channel hoặc channel rỗng.
 */
export const DEFAULT_CHANNEL_SLUG = "dramahd";

export function normalizeChannel(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed || DEFAULT_CHANNEL_SLUG;
}
