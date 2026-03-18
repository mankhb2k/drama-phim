import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const createGenreSchema = z.object({
  name: z.string().min(1, "Tên không được để trống").max(100),
  slug: z.string().max(120).optional(),
  order: z.coerce.number().int().min(0).optional(),
});

/** GET /api/dashboard/genres — Danh sách thể loại (cho form thêm phim & admin) */
export async function GET() {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { movies: true } } },
    });
    return NextResponse.json(genres);
  } catch (error) {
    console.error("[GET /api/dashboard/genres]", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy danh sách thể loại" },
      { status: 500 }
    );
  }
}

/** POST /api/dashboard/genres — Tạo thể loại mới */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const parsed = createGenreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { name, slug: slugInput, order } = parsed.data;
    const slug = (slugInput?.trim() || slugify(name)).toLowerCase();
    if (!slug) {
      return NextResponse.json(
        { error: "Slug không hợp lệ" },
        { status: 400 }
      );
    }
    const existing = await prisma.genre.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Slug đã tồn tại" },
        { status: 409 }
      );
    }
    const maxOrder = await prisma.genre.aggregate({ _max: { order: true } });
    const genre = await prisma.genre.create({
      data: {
        name: name.trim(),
        slug,
        order: order ?? (maxOrder._max.order ?? 0) + 1,
      },
    });
    return NextResponse.json(genre);
  } catch (error) {
    console.error("[POST /api/dashboard/genres]", error);
    return NextResponse.json(
      { error: "Lỗi khi tạo thể loại" },
      { status: 500 }
    );
  }
}
