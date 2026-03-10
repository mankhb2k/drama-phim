import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const updateTagSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().max(120).optional(),
  order: z.coerce.number().int().min(0).optional(),
});

/** PATCH /api/dashboard/tags/[id] */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
  }
  try {
    const body = await _request.json();
    const parsed = updateTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tag không tồn tại" }, { status: 404 });
    }
    const updates: { name?: string; slug?: string; order?: number } = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name.trim();
    if (parsed.data.slug !== undefined) {
      updates.slug = (parsed.data.slug.trim() || slugify(existing.name)).toLowerCase();
      const conflict = await prisma.tag.findFirst({
        where: { slug: updates.slug, id: { not: id } },
      });
      if (conflict) {
        return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 400 });
      }
    }
    if (parsed.data.order !== undefined) updates.order = parsed.data.order;
    const tag = await prisma.tag.update({
      where: { id },
      data: updates,
    });
    return NextResponse.json(tag);
  } catch (error) {
    console.error("[PATCH /api/dashboard/tags/[id]]", error);
    return NextResponse.json({ error: "Lỗi khi cập nhật tag" }, { status: 500 });
  }
}

/** DELETE /api/dashboard/tags/[id] */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
  }
  try {
    await prisma.tag.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/dashboard/tags/[id]]", error);
    return NextResponse.json({ error: "Lỗi khi xóa tag" }, { status: 500 });
  }
}
