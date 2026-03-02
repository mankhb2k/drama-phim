import { NextRequest, NextResponse } from "next/server";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildR2PublicUrl,
  getR2Client,
  getR2Config,
  normalizeSegment,
} from "@/lib/r2";

const finalizeVideoSchema = z.object({
  movieSlug: z.string().min(1),
  episodeNumber: z.number().int().min(1),
  serverName: z.string().min(1).default("R2"),
  objectKey: z.string().min(1),
  playbackUrl: z.string().url().optional(),
  subtitleUrl: z.string().url().optional(),
  vastTagUrl: z.string().url().optional(),
  mimeType: z.string().optional(),
  fileSizeBytes: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = finalizeVideoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;
    const objectKey = data.objectKey.replace(/^\/+/, "");

    const r2Config = getR2Config();
    try {
      await getR2Client().send(
        new HeadObjectCommand({
          Bucket: r2Config.bucket,
          Key: objectKey,
        }),
      );
    } catch {
      return NextResponse.json(
        { error: "File chưa tồn tại trên R2 hoặc key không hợp lệ" },
        { status: 400 },
      );
    }

    const movie = await prisma.movie.findUnique({
      where: { slug: normalizeSegment(data.movieSlug) },
      include: {
        episodes: {
          where: { episodeNumber: data.episodeNumber },
          select: { id: true, episodeNumber: true, watchSlug: true },
        },
      },
    });
    if (!movie) {
      return NextResponse.json({ error: "Không tìm thấy phim" }, { status: 404 });
    }
    const episode = movie.episodes[0];
    if (!episode) {
      return NextResponse.json({ error: "Không tìm thấy tập phim" }, { status: 404 });
    }

    const playbackUrl = data.playbackUrl ?? buildR2PublicUrl(objectKey);
    const priorityBase = await prisma.server.count({ where: { episodeId: episode.id } });

    const server = await prisma.server.create({
      data: {
        episodeId: episode.id,
        name: data.serverName.trim(),
        embedUrl: playbackUrl,
        playbackUrl,
        sourceType: "DIRECT_VIDEO",
        storageProvider: "R2",
        objectKey,
        subtitleUrl: data.subtitleUrl ?? null,
        vastTagUrl: data.vastTagUrl ?? null,
        mimeType: data.mimeType ?? null,
        fileSizeBytes: data.fileSizeBytes ?? null,
        priority: priorityBase,
      },
      select: {
        id: true,
        episodeId: true,
        name: true,
        embedUrl: true,
        playbackUrl: true,
        objectKey: true,
        sourceType: true,
        storageProvider: true,
        priority: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      movieSlug: movie.slug,
      channel: movie.channel,
      episodeNumber: episode.episodeNumber,
      episodeSlug: episode.watchSlug ?? `tap-${episode.episodeNumber}`,
      server,
    });
  } catch (error) {
    console.error("[POST /api/dashboard/videos/finalize]", error);
    return NextResponse.json(
      { error: "Lỗi khi xác nhận video" },
      { status: 500 },
    );
  }
}
