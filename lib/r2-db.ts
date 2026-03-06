import type { PrismaClient } from "@/lib/generated/prisma";

/**
 * Lấy hoặc tạo R2Folder theo bucket + prefix.
 * prefix nên có dạng "videos/nsh/phim-a/" (có hoặc không dấu / cuối).
 * Trả về null nếu prefix rỗng (file ở root).
 */
export async function getOrCreateR2Folder(
  prisma: PrismaClient,
  bucket: string,
  prefix: string,
): Promise<string | null> {
  const normalized = prefix.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!normalized) return null;

  const fullPrefix = `${normalized}/`;
  const name = normalized.split("/").pop() ?? normalized;

  const existing = await prisma.r2Folder.findUnique({
    where: { bucket_prefix: { bucket, prefix: fullPrefix } },
    select: { id: true },
  });
  if (existing) return existing.id;

  const parts = normalized.split("/");
  let parentId: string | null = null;
  for (let i = 0; i < parts.length - 1; i++) {
    const parentPrefix = parts.slice(0, i + 1).join("/") + "/";
    parentId = await getOrCreateR2Folder(prisma, bucket, parentPrefix);
  }

  const created = await prisma.r2Folder.create({
    data: {
      bucket,
      prefix: fullPrefix,
      name,
      parentId,
    },
    select: { id: true },
  });
  return created.id;
}

export type UpsertR2FileParams = {
  bucket: string;
  key: string;
  folderId: string | null;
  displayName: string;
  sizeBytes?: number | null;
  mimeType?: string | null;
  lastModifiedAt?: Date | null;
};

/**
 * Upsert R2File theo (bucket, key). Dùng khi upload xong hoặc sau khi move.
 */
export async function upsertR2File(
  prisma: PrismaClient,
  params: UpsertR2FileParams,
): Promise<void> {
  const { bucket, key, folderId, displayName, sizeBytes, mimeType, lastModifiedAt } = params;
  await prisma.r2File.upsert({
    where: {
      bucket_key: { bucket, key },
    },
    create: {
      bucket,
      key,
      folderId,
      displayName,
      sizeBytes: sizeBytes ?? undefined,
      mimeType: mimeType ?? undefined,
      lastModifiedAt: lastModifiedAt ?? undefined,
    },
    update: {
      folderId,
      displayName,
      sizeBytes: sizeBytes ?? undefined,
      mimeType: mimeType ?? undefined,
      lastModifiedAt: lastModifiedAt ?? undefined,
    },
  });
}

/**
 * Trích prefix (thư mục) từ object key. "videos/nsh/a/b.mp4" -> "videos/nsh/a/"
 * Key ở root (không có /) -> "".
 */
export function getPrefixFromKey(key: string): string {
  const k = key.replace(/^\/+/, "");
  const lastSlash = k.lastIndexOf("/");
  if (lastSlash === -1) return "";
  return k.slice(0, lastSlash + 1);
}

/**
 * Trích tên file (displayName) từ object key.
 */
export function getDisplayNameFromKey(key: string): string {
  const k = key.replace(/^\/+/, "");
  const name = k.split("/").pop();
  return (name ?? k) || "file";
}
