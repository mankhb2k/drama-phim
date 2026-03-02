import { NextRequest, NextResponse } from "next/server";
import { CopyObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getR2Client, getR2Config, normalizeSegment } from "@/lib/r2";

const createFolderSchema = z.object({
  parentPrefix: z.string().default("videos/"),
  name: z.string().min(1),
});

const renameFolderSchema = z.object({
  fromPrefix: z.string().min(1),
  toPrefix: z.string().min(1),
});

const deleteFolderSchema = z.object({
  prefix: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createFolderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const cfg = getR2Config();
  const client = getR2Client();

  const parentPrefix = parsed.data.parentPrefix.replace(/^\/+/, "");
  const name = normalizeSegment(parsed.data.name);
  const folderPrefix = parentPrefix.endsWith("/")
    ? `${parentPrefix}${name}/`
    : `${parentPrefix}/${name}/`;

  try {
    await client.send(
      new CopyObjectCommand({
        Bucket: cfg.bucket,
        CopySource: `${cfg.bucket}/.keep`,
        Key: `${folderPrefix}.keep`,
      }),
    );
  } catch {
    await client.send(
      new CopyObjectCommand({
        Bucket: cfg.bucket,
        CopySource: `${cfg.bucket}/`,
        Key: `${folderPrefix}.keep`,
      }),
    );
  }

  return NextResponse.json({
    name,
    prefix: folderPrefix,
  });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = renameFolderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const cfg = getR2Config();
  const client = getR2Client();

  const fromPrefix = parsed.data.fromPrefix.replace(/^\/+/, "");
  const toPrefix = parsed.data.toPrefix.replace(/^\/+/, "");

  if (fromPrefix === toPrefix) {
    return NextResponse.json({ success: true });
  }

  let continuationToken: string | undefined;

  try {
    do {
      const listResp = await client.send(
        new ListObjectsV2Command({
          Bucket: cfg.bucket,
          Prefix: fromPrefix,
          ContinuationToken: continuationToken,
        }),
      );

      const contents = listResp.Contents ?? [];
      for (const obj of contents) {
        if (!obj.Key) continue;
        const newKey = obj.Key.replace(fromPrefix, toPrefix);
        await client.send(
          new CopyObjectCommand({
            Bucket: cfg.bucket,
            CopySource: `${cfg.bucket}/${obj.Key}`,
            Key: newKey,
          }),
        );
        await client.send(
          new DeleteObjectCommand({
            Bucket: cfg.bucket,
            Key: obj.Key,
          }),
        );
      }

      continuationToken = listResp.NextContinuationToken;
    } while (continuationToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUT /api/dashboard/r2/folders]", error);
    return NextResponse.json(
      { error: "Lỗi khi đổi tên thư mục" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = deleteFolderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const cfg = getR2Config();
  const client = getR2Client();

  const prefix = parsed.data.prefix.replace(/^\/+/, "");

  let continuationToken: string | undefined;

  try {
    do {
      const listResp = await client.send(
        new ListObjectsV2Command({
          Bucket: cfg.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      const contents = listResp.Contents ?? [];
      for (const obj of contents) {
        if (!obj.Key) continue;
        await client.send(
          new DeleteObjectCommand({
            Bucket: cfg.bucket,
            Key: obj.Key,
          }),
        );
      }

      continuationToken = listResp.NextContinuationToken;
    } while (continuationToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/dashboard/r2/folders]", error);
    return NextResponse.json(
      { error: "Lỗi khi xoá thư mục" },
      { status: 500 },
    );
  }
}

