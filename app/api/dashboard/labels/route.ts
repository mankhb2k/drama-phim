import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const createLabelSchema = z.object({
  name: z.string().min(1, "Tên không được để trống").max(100),
  slug: z.string().max(120).optional(),
  order: z.coerce.number().int().min(0).optional(),
  textColor: z.string().max(30).optional().nullable(),
  backgroundColor: z.string().max(30).optional().nullable(),
});

/** GET /api/dashboard/labels — Danh sách nhãn (Hot, Phim mới, Đang chiếu, ...) */
export async function GET() {
  try {
    const labels = await prisma.label.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { movies: true } } },
    });
    return NextResponse.json(labels);
  } catch (error) {
    console.error("[GET /api/dashboard/labels]", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy danh sách label" },
      { status: 500 }
    );
  }
}

/** POST /api/dashboard/labels — Tạo label mới */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const parsed = createLabelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { name, slug: slugInput, order, textColor, backgroundColor } = parsed.data;
    const slug = (slugInput?.trim() || slugify(name)).toLowerCase();
    if (!slug) {
      return NextResponse.json(
        { error: "Slug không hợp lệ" },
        { status: 400 }
      );
    }
    const existing = await prisma.label.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Slug đã tồn tại" },
        { status: 400 }
      );
    }
    const maxOrder = await prisma.label.aggregate({ _max: { order: true } });
    const label = await prisma.label.create({
      data: {
        name: name.trim(),
        slug,
        order: order ?? (maxOrder._max.order ?? 0) + 1,
        textColor: textColor?.trim() || null,
        backgroundColor: backgroundColor?.trim() || null,
      },
    });
    return NextResponse.json(label);
  } catch (error) {
    console.error("[POST /api/dashboard/labels]", error);
    return NextResponse.json(
      { error: "Lỗi khi tạo label" },
      { status: 500 }
    );
  }
}
