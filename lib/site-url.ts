/**
 * Base URL của site (ví dụ: https://dramahd.vn).
 * Dùng cho canonical URL, Open Graph URL, v.v.
 * Set NEXT_PUBLIC_SITE_URL trong .env (production).
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "";
}

/** Trả về canonical URL đầy đủ cho path (chỉ khi getBaseUrl() có giá trị). */
export function getCanonicalUrl(path: string): string | undefined {
  const base = getBaseUrl();
  if (!base) return undefined;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${normalizedPath}`;
}
