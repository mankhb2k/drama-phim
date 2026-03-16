import { NextRequest, NextResponse } from "next/server";
import { CopyObjectCommand, DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getR2Client, getR2Config, getR2ConfigWithBucket, normalizeSegment } from "@/lib/r2";
import { getOrCreateR2Folder } from "@/lib/r2-db";

const createFolderSchema = z.object({
  parentPrefix: z.string().default("videos/"),
  name: z.string().min(1),
  bucket: z.string().min(1).optional(),
});

const renameFolderSchema = z.object({
  fromPrefix: z.string().min(1),
  toPrefix: z.string().min(1),
  /** Tên hiển thị (tiếng Việt) cho folder sau khi đổi tên; nếu không gửi thì dùng segment của toPrefix */
  displayName: z.string().min(1).optional(),
  bucket: z.string().min(1).optional(),
});

const deleteFolderSchema = z.object({
  prefix: z.string().min(1),
  bucket: z.string().min(1).optional(),
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

  const cfg = parsed.data.bucket
    ? getR2ConfigWithBucket(parsed.data.bucket)
    : getR2Config();
  const client = getR2Client();

  const parentPrefix = parsed.data.parentPrefix.replace(/^\/+/, "").replace(/\/+$/, "") || "";
  const displayName = parsed.data.name.trim();
  const segment = normalizeSegment(displayName);
  if (!displayName) {
    return NextResponse.json({ error: "Thiếu tên thư mục" }, { status: 400 });
  }
  if (!segment || segment.endsWith("-") || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment)) {
    return NextResponse.json(
      { error: "Tên thư mục không hợp lệ. Vui lòng nhập tên khác (sẽ tự tạo prefix không dấu)." },
      { status: 400 },
    );
  }
  const folderPrefixBase = parentPrefix === "" ? "" : `${parentPrefix}/`;

  // Tạo/đảm bảo parent folder tồn tại trong DB để check trùng tên theo cùng thư mục
  const parentId = await getOrCreateR2Folder(prisma, cfg.bucket, folderPrefixBase);
  const existingByName = await prisma.r2Folder.findFirst({
    where: {
      bucket: cfg.bucket,
      parentId,
      name: { equals: displayName, mode: "insensitive" },
    },
    select: { id: true, prefix: true },
  });
  if (existingByName) {
    return NextResponse.json(
      { error: `Tên thư mục "${displayName}" đã tồn tại trong thư mục hiện tại.` },
      { status: 409 },
    );
  }

  // Tránh trùng prefix (do slug trùng). Auto thêm -2, -3...
  let folderPrefix = `${folderPrefixBase}${segment}/`;
  for (let i = 2; i <= 99; i++) {
    const existsInDb = await prisma.r2Folder.findUnique({
      where: { bucket_prefix: { bucket: cfg.bucket, prefix: folderPrefix } },
      select: { id: true },
    });
    if (!existsInDb) break;
    folderPrefix = `${folderPrefixBase}${segment}-${i}/`;
  }

  // Check nhanh xem folderPrefix đã tồn tại trên R2 chưa (đề phòng DB chưa sync)
  const checkResp = await client.send(
    new ListObjectsV2Command({
      Bucket: cfg.bucket,
      Prefix: folderPrefix,
      MaxKeys: 1,
    }),
  );
  const hasAny = (checkResp.Contents?.length ?? 0) > 0 || (checkResp.CommonPrefixes?.length ?? 0) > 0;
  if (hasAny) {
    return NextResponse.json(
      {
        error:
          `Prefix "${folderPrefix}" đã tồn tại trên R2. ` +
          "Hãy đổi tên thư mục (ví dụ thêm năm, hoặc thêm ký tự phân biệt).",
      },
      { status: 409 },
    );
  }

  const key = `${folderPrefix}.keep`;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
        Body: new Uint8Array(0),
      }),
    );

    // Lưu metadata folder vào DB để có thể hiển thị tên tiếng Việt theo prefix
    await prisma.r2Folder.create({
      data: {
        bucket: cfg.bucket,
        prefix: folderPrefix,
        name: displayName,
        parentId,
      },
      select: { id: true },
    });
  } catch (err) {
    console.error("[POST /api/dashboard/r2/folders] PutObject failed:", err);
    return NextResponse.json(
      { error: "Không thể tạo thư mục trên R2. Kiểm tra quyền và tên bucket." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    name: displayName,
    segment,
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

  const cfg = parsed.data.bucket
    ? getR2ConfigWithBucket(parsed.data.bucket)
    : getR2Config();
  const client = getR2Client();

  const normalizePrefix = (p: string) => p.replace(/^\/+/, "").replace(/\/+$/, "") + "/";
  const fromPrefix = normalizePrefix(parsed.data.fromPrefix);
  const toPrefix = normalizePrefix(parsed.data.toPrefix);

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

    // Cập nhật R2Folder: xóa bản ghi cũ (fromPrefix), tạo bản ghi mới (toPrefix) với tên hiển thị tiếng Việt
    const displayName = parsed.data.displayName?.trim();
    const segment = toPrefix.replace(/\/+$/, "").split("/").pop() ?? "";
    const nameToSave = displayName || segment;

    const oldRow = await prisma.r2Folder.findUnique({
      where: { bucket_prefix: { bucket: cfg.bucket, prefix: fromPrefix } },
      select: { id: true, parentId: true },
    });
    if (oldRow) {
      await prisma.r2Folder.delete({ where: { id: oldRow.id } });
    }

    const toParts = toPrefix.replace(/\/+$/, "").split("/").filter(Boolean);
    const parentPrefix =
      toParts.length <= 1 ? "" : toParts.slice(0, -1).join("/") + "/";
    const parentId =
      !parentPrefix ? null : await getOrCreateR2Folder(prisma, cfg.bucket, parentPrefix);

    await prisma.r2Folder.upsert({
      where: { bucket_prefix: { bucket: cfg.bucket, prefix: toPrefix } },
      create: {
        bucket: cfg.bucket,
        prefix: toPrefix,
        name: nameToSave,
        parentId,
      },
      update: { name: nameToSave },
    });

    return NextResponse.json({
      success: true,
      newPrefix: toPrefix,
      displayName: nameToSave,
    });
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

  const cfg = parsed.data.bucket
    ? getR2ConfigWithBucket(parsed.data.bucket)
    : getR2Config();
  const client = getR2Client();

  const prefixRaw = parsed.data.prefix.replace(/^\/+/, "");
  const prefix = prefixRaw.endsWith("/") ? prefixRaw : `${prefixRaw}/`;

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

    const deletedFolder = await prisma.r2Folder.findUnique({
      where: { bucket_prefix: { bucket: cfg.bucket, prefix } },
      select: { id: true },
    });
    if (deletedFolder) {
      await prisma.r2Folder.delete({
        where: { id: deletedFolder.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/dashboard/r2/folders]", error);
    return NextResponse.json(
      { error: "Lỗi khi xoá thư mục" },
      { status: 500 },
    );
  }
}

