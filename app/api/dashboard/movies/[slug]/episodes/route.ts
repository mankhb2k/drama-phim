import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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

const episodeSchema = z.object({
  episodeNumber: z.coerce.number().int().min(1, "Số tập phải >= 1"),
  name: z.string().optional(),
  subtitleUrl: z.string().optional(),
  servers: z.array(serverSchema).default([]),
});

const updateEpisodesSchema = z.object({
  movieId: z.coerce.number().int().positive(),
  episodes: z.array(episodeSchema).default([]),
});

type Context = { params: Promise<{ slug: string }> };

/** PUT /api/dashboard/movies/[slug]/episodes — Rebuild danh sách tập & server cho phim */
export async function PUT(request: NextRequest, _context: Context) {
  try {
    const body = await request.json();
    const parsed = updateEpisodesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu tập không hợp lệ", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;

    const movie = await prisma.movie.findUnique({
      where: { id: data.movieId },
      select: { id: true },
    });
    if (!movie) {
      return NextResponse.json(
        { error: "Không tìm thấy phim" },
        { status: 404 },
      );
    }

    // Kiểm tra trùng số tập để tránh lỗi unique constraint (movieId, episodeNumber)
    if (data.episodes && data.episodes.length > 0) {
      const seenNumbers = new Set<number>();
      const duplicatedNumbers = new Set<number>();
      for (const ep of data.episodes) {
        const num = ep.episodeNumber;
        if (seenNumbers.has(num)) {
          duplicatedNumbers.add(num);
        } else {
          seenNumbers.add(num);
        }
      }
      if (duplicatedNumbers.size > 0) {
        return NextResponse.json(
          {
            error: "Số tập bị trùng. Mỗi tập phải có số khác nhau.",
            duplicatedEpisodeNumbers: Array.from(duplicatedNumbers),
          },
          { status: 400 },
        );
      }
    }

    await prisma.$transaction(async (tx: PrismaTx) => {
      // 1. Xóa server trước (theo episode thuộc phim này) để tránh vi phạm FK khi xóa episode
      await tx.server.deleteMany({
        where: { episode: { movieId: movie.id } },
      });
      // 2. Xóa toàn bộ tập của phim
      await tx.episode.deleteMany({ where: { movieId: movie.id } });
      // 3. Tạo từng tập rồi tạo server cho tập đó (episode tồn tại trước khi tạo server)
      for (const ep of data.episodes) {
        const created = await tx.episode.create({
          data: {
            movieId: movie.id,
            episodeNumber: ep.episodeNumber,
            watchSlug: `tap-${ep.episodeNumber}`,
            name: ep.name?.trim() || `Tập ${ep.episodeNumber}`,
            subtitleUrl: ep.subtitleUrl?.trim() || null,
          },
        });
        if (ep.servers.length > 0) {
          await tx.server.createMany({
            data: ep.servers.map((s: (typeof ep.servers)[number], i: number) => ({
              episodeId: created.id,
              name: s.name.trim(),
              embedUrl: (s.playbackUrl ?? s.embedUrl ?? "").trim(),
              playbackUrl: s.playbackUrl?.trim() || null,
              objectKey: s.objectKey?.trim() || null,
              r2FileId: s.r2FileId?.trim() || null,
              sourceType: s.sourceType,
              storageProvider: s.storageProvider,
              subtitleUrl: s.subtitleUrl?.trim() || null,
              vastTagUrl: s.vastTagUrl?.trim() || null,
              mimeType: s.mimeType?.trim() || null,
              fileSizeBytes: s.fileSizeBytes ?? null,
              durationSeconds: s.durationSeconds ?? null,
              priority: s.priority ?? i,
              isActive: s.isActive ?? true,
            })),
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUT /api/dashboard/movies/[slug]/episodes]", error);
    const message =
      error instanceof Error ? error.message : "Lỗi khi cập nhật tập phim";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

