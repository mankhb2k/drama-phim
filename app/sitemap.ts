import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/site-url";

/**
 * Sitemap động — các trang quan trọng cho SEO (trừ Dashboard và trang nội bộ).
 * Cần set NEXT_PUBLIC_SITE_URL để URL trong sitemap là absolute.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl() || "https://dramahd.net";
  const base = baseUrl.replace(/\/$/, "");

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/phim-hot`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/phim-moi`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const [movies, genres] = await Promise.all([
    prisma.movie.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.genre.findMany({
      select: { slug: true },
    }),
  ]);

  const moviePages: MetadataRoute.Sitemap = movies.map(
    (m: { slug: string; updatedAt: Date }) => ({
      url: `${base}/movies/${m.slug}`,
      lastModified: m.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }),
  );

  const genrePages: MetadataRoute.Sitemap = genres.map(
    (g: { slug: string }) => ({
      url: `${base}/the-loai/${g.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }),
  );

  return [...staticPages, ...moviePages, ...genrePages];
}
