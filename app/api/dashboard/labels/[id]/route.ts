import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const updateLabelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().max(120).optional(),
  order: z.coerce.number().int().min(0).optional(),
  textColor: z.string().max(30).optional().nullable(),
  backgroundColor: z.string().max(30).optional().nullable(),
});

/** PATCH /api/dashboard/labels/[id] */
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
    const parsed = updateLabelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const existing = await prisma.label.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Label không tồn tại" }, { status: 404 });
    }
    const updates: { name?: string; slug?: string; order?: number; textColor?: string | null; backgroundColor?: string | null } = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name.trim();
    if (parsed.data.textColor !== undefined) updates.textColor = parsed.data.textColor?.trim() || null;
    if (parsed.data.backgroundColor !== undefined) updates.backgroundColor = parsed.data.backgroundColor?.trim() || null;
    if (parsed.data.slug !== undefined) {
      updates.slug = (parsed.data.slug.trim() || slugify(existing.name)).toLowerCase();
      const conflict = await prisma.label.findFirst({
        where: { slug: updates.slug, id: { not: id } },
      });
      if (conflict) {
        return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 400 });
      }
    }
    if (parsed.data.order !== undefined) updates.order = parsed.data.order;
    const label = await prisma.label.update({
      where: { id },
      data: updates,
    });
    return NextResponse.json(label);
  } catch (error) {
    console.error("[PATCH /api/dashboard/labels/[id]]", error);
    return NextResponse.json({ error: "Lỗi khi cập nhật label" }, { status: 500 });
  }
}

/** DELETE /api/dashboard/labels/[id] */
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
    await prisma.label.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/dashboard/labels/[id]]", error);
    return NextResponse.json({ error: "Lỗi khi xóa label" }, { status: 500 });
  }
}
