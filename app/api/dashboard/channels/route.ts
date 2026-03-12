import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const channelSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug không được để trống")
    .max(50, "Slug tối đa 50 ký tự")
    .regex(/^[a-z0-9-]+$/, "Chỉ dùng chữ thường, số và dấu gạch ngang (-)"),
  name: z
    .string()
    .min(1, "Tên không được để trống")
    .max(100, "Tên tối đa 100 ký tự")
    .optional()
    .default(""),
});

/** GET /api/dashboard/channels — Danh sách channel (slug + name) */
export async function GET() {
  try {
    const channels = await prisma.channel.findMany({
      orderBy: { slug: "asc" },
      select: { id: true, slug: true, name: true, createdAt: true },
    });
    return NextResponse.json({ items: channels });
  } catch (error) {
    console.error("[GET /api/dashboard/channels]", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy danh sách channel" },
      { status: 500 },
    );
  }
}

/** POST /api/dashboard/channels — Tạo nhanh channel mới */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = channelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;
    const slug = data.slug.trim();
    const name = (data.name ?? "").trim() || slug.toUpperCase();

    const existing = await prisma.channel.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: `Channel "${slug}" đã tồn tại` },
        { status: 409 },
      );
    }

    const channel = await prisma.channel.create({
      data: { slug, name },
      select: { id: true, slug: true, name: true, createdAt: true },
    });
    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error("[POST /api/dashboard/channels]", error);
    return NextResponse.json(
      { error: "Lỗi khi tạo channel mới" },
      { status: 500 },
    );
  }
}

