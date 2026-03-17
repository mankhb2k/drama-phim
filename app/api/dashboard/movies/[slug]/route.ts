import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeChannel } from "@/lib/channel";
import { slugify } from "@/lib/slug";

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const serverSchema = z
  .object({
    name: z.string().min(1, "Tên server không được để trống"),
    embedUrl: z.string().optional(),
    playbackUrl: z.string().optional(),
    objectKey: z.string().optional(),
    r2FileId: z.string().optional().nullable(),
    sourceType: z.enum(["EMBED", "DIRECT_VIDEO"]).default("EMBED"),
    storageProvider: z.enum(["EXTERNAL", "R2"]).default("EXTERNAL"),
    subtitleUrl: z.string().optional(),
    vastTagUrl: z.string().optional(),
    mimeType: z.string().optional(),
    fileSizeBytes: z.coerce.number().int().positive().optional(),
    durationSeconds: z.coerce.number().int().positive().optional(),
    isActive: z.coerce.boolean().optional().default(true),
    priority: z.coerce.number().int().min(0).optional().default(0),
  })
  .superRefine((value, ctx) => {
    const hasUrl = Boolean(
      value.embedUrl?.trim() ||
        value.playbackUrl?.trim() ||
        value.objectKey?.trim(),
    );
    if (!hasUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cần ít nhất embedUrl, playbackUrl hoặc objectKey",
        path: ["embedUrl"],
      });
    }
  });

const updateMovieSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  slug: z.string().min(1).optional(),
  channel: z
    .string()
    .optional()
    .default("dramahd")
    .transform((s) => (s?.trim() || "dramahd")),
  audioType: z.enum(["NONE", "SUB", "DUBBED"]).optional().default("NONE"),
  originalTitle: z.string().optional(),
  description: z.string().optional(),
  poster: z
    .string()
    .optional()
    .refine(
      (v) => !v || v === "" || /^https?:\/\//.test(v),
      "URL không hợp lệ",
    ),
  backdrop: z
    .string()
    .optional()
    .refine(
      (v) => !v || v === "" || /^https?:\/\//.test(v),
      "URL không hợp lệ",
    ),
  year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  status: z.enum(["ONGOING", "COMPLETED"]).default("ONGOING"),
  genreIds: z.array(z.coerce.number().int().positive()).default([]),
  tagIds: z.array(z.coerce.number().int().positive()).default([]),
  labelIds: z.array(z.coerce.number().int().positive()).default([]),
});

type Context = { params: Promise<{ slug: string }> };

/** GET /api/dashboard/movies/[slug] — Chi tiết phim đầy đủ (cho form sửa) */
export async function GET(_request: NextRequest, context: Context) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json({ error: "Thiếu slug" }, { status: 400 });
    }

    const movie = await prisma.movie.findUnique({
      where: { slug },
      include: {
        genres: { select: { id: true, slug: true, name: true } },
        tags: { select: { id: true, slug: true, name: true } },
        labels: { select: { id: true, slug: true, name: true } },
        episodes: {
          orderBy: { episodeNumber: "asc" },
          include: { servers: { orderBy: { priority: "asc" } } },
        },
      },
    });

    if (!movie) {
      return NextResponse.json(
        { error: "Không tìm thấy phim" },
        { status: 404 },
      );
    }

    return NextResponse.json(movie);
  } catch (error) {
    console.error("[GET /api/dashboard/movies/[slug]]", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy chi tiết phim" },
      { status: 500 },
    );
  }
}

/** PATCH /api/dashboard/movies/[slug] — Cập nhật phim */
export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json({ error: "Thiếu slug" }, { status: 400 });
    }

    const current = await prisma.movie.findUnique({
      where: { slug },
      include: { episodes: true },
    });
    if (!current) {
      return NextResponse.json(
        { error: "Không tìm thấy phim" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = updateMovieSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;

    const channel = normalizeChannel(data.channel);
    const rawSlug = data.slug?.trim();
    const currentSlugPart = current.slug.startsWith(current.channel + "-")
      ? current.slug.slice(current.channel.length + 1)
      : current.slug;
    const slugPart =
      rawSlug && rawSlug.length > 0
        ? slugify(rawSlug)
        : slugify(data.title) || currentSlugPart || "phim";
    const newSlug = `${channel}-${slugPart}`;
    const posterUrl =
      data.poster !== undefined
        ? (data.poster && data.poster !== "" ? data.poster : null)
        : undefined;
    const backdropUrl =
      data.backdrop !== undefined
        ? (data.backdrop && data.backdrop !== "" ? data.backdrop : null)
        : undefined;

    if (newSlug !== current.slug) {
      const existing = await prisma.movie.findUnique({
        where: { slug: newSlug },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Slug "${newSlug}" đã tồn tại. Vui lòng chọn slug khác.` },
          { status: 409 },
        );
      }
    }

    const updateData: Parameters<typeof prisma.movie.update>[0]["data"] = {
      slug: newSlug,
      channel,
      title: data.title.trim(),
      originalTitle: data.originalTitle?.trim() || null,
      description: data.description?.trim() || null,
      year: data.year ?? null,
      status: data.status,
      audioType: data.audioType ?? "NONE",
      genres: { set: data.genreIds.map((id: number) => ({ id })) },
      tags: { set: data.tagIds.map((id: number) => ({ id })) },
      labels: { set: data.labelIds.map((id: number) => ({ id })) },
    };
    if (posterUrl !== undefined) updateData.poster = posterUrl;
    if (backdropUrl !== undefined) updateData.backdrop = backdropUrl;
    await prisma.movie.update({
      where: { id: current.id },
      data: updateData,
    });

    const movie = await prisma.movie.findUnique({
      where: { id: current.id },
      include: {
        genres: { select: { id: true, slug: true, name: true } },
        tags: { select: { id: true, slug: true, name: true } },
        labels: { select: { id: true, slug: true, name: true } },
        episodes: {
          orderBy: { episodeNumber: "asc" },
          include: { servers: { orderBy: { priority: "asc" } } },
        },
      },
    });

    return NextResponse.json(movie);
  } catch (error) {
    console.error("[PATCH /api/dashboard/movies/[slug]]", error);
    const message =
      error instanceof Error ? error.message : "Lỗi khi cập nhật phim";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

/** DELETE /api/dashboard/movies/[slug] — Xóa phim */
export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json({ error: "Thiếu slug" }, { status: 400 });
    }

    const movie = await prisma.movie.findUnique({ where: { slug } });
    if (!movie) {
      return NextResponse.json(
        { error: "Không tìm thấy phim" },
        { status: 404 },
      );
    }

    await prisma.movie.delete({ where: { id: movie.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/dashboard/movies/[slug]]", error);
    return NextResponse.json({ error: "Lỗi khi xóa phim" }, { status: 500 });
  }
}
