import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getR2ConfigWithBucket } from "@/lib/r2";

const querySchema = z.object({
  bucket: z.string().min(1, "bucket là bắt buộc"),
  folderId: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() && /^[0-9a-f-]{36}$/i.test(v) ? v : undefined)),
  /** Lọc file có key bắt đầu bằng prefix (ưu tiên hơn folderId khi dùng từ UI). */
  prefix: z.string().optional(),
  q: z.string().optional(),
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * GET /api/dashboard/r2/files?bucket=...&folderId=...&q=...&skip=0&take=20
 * folderId null/omit = chỉ file ở root bucket.
 * q = tìm kiếm trong displayName (contains, case-insensitive).
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    bucket: searchParams.get("bucket") ?? undefined,
    folderId: searchParams.get("folderId") ?? undefined,
    prefix: searchParams.get("prefix") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    skip: searchParams.get("skip") ?? undefined,
    take: searchParams.get("take") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { bucket, folderId, prefix, q, skip, take } = parsed.data;

  try {
    const normalizedPrefix = (prefix?.replace(/^\/+/, "") ?? "").trim();
    const prefixWithSlash = normalizedPrefix.endsWith("/")
      ? normalizedPrefix
      : normalizedPrefix
        ? `${normalizedPrefix}/`
        : "";
    const where = {
      bucket,
      ...(prefixWithSlash
        ? { key: { startsWith: prefixWithSlash } }
        : { folderId: folderId ?? null }),
      ...(q && q.trim() !== ""
        ? { displayName: { contains: q.trim(), mode: "insensitive" as const } }
        : {}),
    };

    const [allFiles, total] = await Promise.all([
      prisma.r2File.findMany({
        where,
        skip: prefixWithSlash ? 0 : skip,
        take: prefixWithSlash ? 1000 : take,
        orderBy: [{ lastModifiedAt: "desc" }, { createdAt: "desc" }],
        include: {
          folder: {
            select: { id: true, prefix: true, name: true },
          },
        },
      }),
      prisma.r2File.count({ where }),
    ]);

    const files = prefixWithSlash
      ? allFiles
          .filter(
            (f) => !f.key.slice(prefixWithSlash.length).includes("/"),
          )
          .slice(skip, skip + take)
      : allFiles;

    let publicBaseUrl: string | null = null;
    try {
      publicBaseUrl = getR2ConfigWithBucket(bucket).publicBaseUrl;
    } catch {
      // env R2 chưa cấu hình hoặc bucket khác
    }

    const filesWithUrl = files.map((f: (typeof files)[number]) => ({
      ...f,
      publicUrl: publicBaseUrl ? `${publicBaseUrl.replace(/\/+$/, "")}/${f.key}` : null,
    }));

    return NextResponse.json({
      files: filesWithUrl,
      total,
      skip,
      take,
    });
  } catch (error) {
    console.error("[GET /api/dashboard/r2/files]", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy danh sách file" },
      { status: 500 },
    );
  }
}
