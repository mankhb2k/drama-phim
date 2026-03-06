import { NextRequest, NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getR2Client, getR2ConfigWithBucket } from "@/lib/r2";
import {
  getOrCreateR2Folder,
  getDisplayNameFromKey,
  getPrefixFromKey,
  upsertR2File,
} from "@/lib/r2-db";

const syncSchema = z.object({
  bucket: z.string().min(1, "bucket là bắt buộc"),
  prefix: z.string().default(""),
});

/**
 * POST /api/dashboard/r2/sync
 * Body: { bucket: string, prefix?: string }
 * List objects trên R2 theo bucket + prefix, upsert R2File (và R2Folder) vào DB.
 * Xóa bản ghi R2File trong DB có key nằm dưới prefix nhưng không còn trên R2.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = syncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { bucket, prefix } = parsed.data;
  const normalizedPrefix = prefix.replace(/^\/+/, "");

  try {
    const cfg = getR2ConfigWithBucket(bucket);
    const client = getR2Client();

    const listedKeys: string[] = [];
    let continuationToken: string | undefined;

    do {
      const res = await client.send(
        new ListObjectsV2Command({
          Bucket: cfg.bucket,
          Prefix: normalizedPrefix,
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        }),
      );

      const contents = res.Contents ?? [];
      for (const obj of contents) {
        if (!obj.Key) continue;
        listedKeys.push(obj.Key);
        const keyPrefix = getPrefixFromKey(obj.Key);
        const folderId = keyPrefix
          ? await getOrCreateR2Folder(prisma, bucket, keyPrefix)
          : null;
        await upsertR2File(prisma, {
          bucket,
          key: obj.Key,
          folderId,
          displayName: getDisplayNameFromKey(obj.Key),
          sizeBytes: obj.Size ?? undefined,
          mimeType: undefined,
          lastModifiedAt: obj.LastModified ?? undefined,
        });
      }

      continuationToken = res.NextContinuationToken;
    } while (continuationToken);

    const toDelete = await prisma.r2File.findMany({
      where: {
        bucket,
        key: normalizedPrefix
          ? { startsWith: normalizedPrefix, notIn: listedKeys }
          : { notIn: listedKeys },
      },
      select: { id: true },
    });
    if (toDelete.length > 0) {
      await prisma.r2File.deleteMany({
        where: { id: { in: toDelete.map((r: (typeof toDelete)[number]) => r.id) } },
      });
    }

    return NextResponse.json({
      upserted: listedKeys.length,
      deletedFromDb: toDelete.length,
      bucket,
      prefix: normalizedPrefix || "(root)",
    });
  } catch (error) {
    console.error("[POST /api/dashboard/r2/sync]", error);
    return NextResponse.json(
      { error: "Lỗi khi đồng bộ R2 với DB" },
      { status: 500 },
    );
  }
}
