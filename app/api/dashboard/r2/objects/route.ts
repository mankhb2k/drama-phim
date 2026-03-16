import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listR2Objects } from "@/lib/r2-objects";

const querySchema = z.object({
  prefix: z.string().optional(),
  search: z.string().optional(),
  continuationToken: z.string().optional(),
  bucket: z.string().min(1).optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const raw = {
    prefix: searchParams.get("prefix") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    continuationToken: searchParams.get("continuationToken") ?? undefined,
    bucket: searchParams.get("bucket") ?? undefined,
  };

  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const prefixParam =
      parsed.data.prefix === ""
        ? ""
        : (parsed.data.prefix ?? "videos/");
    const result = await listR2Objects({
      prefix: prefixParam,
      search: parsed.data.search ?? undefined,
      continuationToken: parsed.data.continuationToken ?? undefined,
      bucket: parsed.data.bucket ?? undefined,
    });

    // Map folder prefix -> tên hiển thị (tiếng Việt) từ DB nếu có
    const bucketName = parsed.data.bucket ?? undefined;
    const normalizePrefix = (p: string) => p.replace(/\/+$/, "") + "/";

    if (bucketName) {
      if (Array.isArray(result.folders) && result.folders.length > 0) {
        const prefixes = result.folders.map((f) => normalizePrefix(f.prefix));
        const rows = await prisma.r2Folder.findMany({
          where: {
            bucket: bucketName,
            prefix: { in: prefixes },
          },
          select: { prefix: true, name: true },
        });
        const map = new Map(rows.map((r) => [normalizePrefix(r.prefix), r.name]));
        result.folders = result.folders.map((f) => ({
          ...f,
          name: map.get(normalizePrefix(f.prefix)) ?? f.name,
        }));
      }
      // Tên thư mục hiện tại (prefix đang xem) để hiển thị breadcrumb/sidebar
      let currentFolderDisplayName: string | null = null;
      if (prefixParam && prefixParam !== "") {
        const currentPrefix = normalizePrefix(prefixParam);
        const currentRow = await prisma.r2Folder.findUnique({
          where: {
            bucket_prefix: { bucket: bucketName, prefix: currentPrefix },
          },
          select: { name: true },
        });
        currentFolderDisplayName = currentRow?.name ?? null;
      }
      return NextResponse.json({
        ...result,
        currentFolderDisplayName,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/dashboard/r2/objects]", error);
    const message =
      error instanceof Error ? error.message : "Lỗi khi lấy danh sách object từ R2";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

