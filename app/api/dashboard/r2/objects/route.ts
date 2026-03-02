import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { listR2Objects } from "@/lib/r2-objects";

const querySchema = z.object({
  prefix: z.string().optional(),
  search: z.string().optional(),
  continuationToken: z.string().optional(),
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
  };

  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await listR2Objects({
      prefix: parsed.data.prefix ?? "videos/",
      search: parsed.data.search ?? undefined,
      continuationToken: parsed.data.continuationToken ?? undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/dashboard/r2/objects]", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy danh sách object từ R2" },
      { status: 500 },
    );
  }
}

