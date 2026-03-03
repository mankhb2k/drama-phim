import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getR2Client, getR2Config, getR2ConfigWithBucket } from "@/lib/r2";

const deleteSchema = z.object({
  keys: z.array(z.string().min(1)).min(1, "Cần ít nhất một key để xóa"),
  bucket: z.string().min(1).optional(),
});

/**
 * Xóa một hoặc nhiều object trong bucket R2.
 * Body: { keys: string[], bucket?: string }
 * Nếu không gửi bucket thì dùng bucket mặc định từ env.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const cfg = parsed.data.bucket
    ? getR2ConfigWithBucket(parsed.data.bucket)
    : getR2Config();
  const client = getR2Client();

  const trimmedKeys = parsed.data.keys
    .map((k) => k.replace(/^\/+/, ""))
    .filter(Boolean);

  try {
    for (const key of trimmedKeys) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: cfg.bucket,
          Key: key,
        }),
      );
    }
    await prisma.r2File.deleteMany({
      where: {
        bucket: cfg.bucket,
        key: { in: trimmedKeys },
      },
    });
    return NextResponse.json({
      deleted: trimmedKeys.length,
      bucket: cfg.bucket,
    });
  } catch (error) {
    console.error("[POST /api/dashboard/r2/objects/delete]", error);
    return NextResponse.json(
      { error: "Lỗi khi xóa file trên R2" },
      { status: 500 },
    );
  }
}
