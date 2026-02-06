import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const serverSchema = z.object({
  name: z.string().min(1, "Tên server không được để trống"),
  embedUrl: z.string().min(1, "Link embed không được để trống"),
  priority: z.coerce.number().int().min(0).optional().default(0),
});

const episodeSchema = z.object({
  episodeNumber: z.coerce.number().int().min(1, "Số tập phải >= 1"),
  name: z.string().optional(),
  servers: z.array(serverSchema).default([]),
});

const createMovieSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  slug: z.string().min(1).optional(),
  originalTitle: z.string().optional(),
  description: z.string().optional(),
  poster: z
    .string()
    .optional()
    .refine(
      (v) => !v || v === "" || /^https?:\/\//.test(v),
      "URL không hợp lệ"
    ),
  backdrop: z
    .string()
    .optional()
    .refine(
      (v) => !v || v === "" || /^https?:\/\//.test(v),
      "URL không hợp lệ"
    ),
  year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  status: z.enum(["ONGOING", "COMPLETED"]).default("ONGOING"),
  genreIds: z.array(z.coerce.number().int().positive()).default([]),
  tagIds: z.array(z.coerce.number().int().positive()).default([]),
  episodes: z.array(episodeSchema).default([]),
});

export type CreateMovieInput = z.infer<typeof createMovieSchema>;

/** POST /api/dashboard/movies — Thêm phim mới */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createMovieSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const slug =
      data.slug?.trim() || slugify(data.title) || `phim-${Date.now()}`;
    const posterUrl =
      data.poster && data.poster !== "" ? data.poster : undefined;
    const backdropUrl =
      data.backdrop && data.backdrop !== "" ? data.backdrop : undefined;

    const existing = await prisma.movie.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: `Slug "${slug}" đã tồn tại. Vui lòng chọn slug khác.` },
        { status: 409 }
      );
    }

    const movie = await prisma.movie.create({
      data: {
        slug,
        title: data.title.trim(),
        originalTitle: data.originalTitle?.trim() || null,
        description: data.description?.trim() || null,
        poster: posterUrl ?? null,
        backdrop: backdropUrl ?? null,
        year: data.year ?? null,
        status: data.status,
        genres: data.genreIds.length
          ? { connect: data.genreIds.map((id) => ({ id })) }
          : undefined,
        tags: data.tagIds.length
          ? { connect: data.tagIds.map((id) => ({ id })) }
          : undefined,
        episodes:
          data.episodes.length > 0
            ? {
                create: data.episodes.map((ep) => ({
                  episodeNumber: ep.episodeNumber,
                  name: ep.name?.trim() || `Tập ${ep.episodeNumber}`,
                  servers:
                    ep.servers.length > 0
                      ? {
                          create: ep.servers.map((s, i) => ({
                            name: s.name.trim(),
                            embedUrl: s.embedUrl.trim(),
                            priority: s.priority ?? i,
                          })),
                        }
                      : undefined,
                })),
              }
            : undefined,
      },
      include: {
        genres: { select: { id: true, slug: true, name: true } },
        tags: { select: { id: true, slug: true, name: true } },
        episodes: {
          include: {
            servers: true,
          },
        },
      },
    });

    return NextResponse.json(movie);
  } catch (error) {
    console.error("[POST /api/dashboard/movies]", error);
    return NextResponse.json({ error: "Lỗi khi thêm phim" }, { status: 500 });
  }
}
