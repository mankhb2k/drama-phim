import { NextRequest, NextResponse } from "next/server";
import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getR2Client, getR2Config } from "@/lib/r2";

const moveSchema = z.object({
  fromKey: z.string().min(1),
  toPrefix: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = moveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const cfg = getR2Config();
  const client = getR2Client();

  const fromKey = parsed.data.fromKey.replace(/^\/+/, "");
  const toPrefix = parsed.data.toPrefix.replace(/^\/+/, "");

  const fileName = fromKey.split("/").pop() ?? fromKey;
  const normalizedPrefix = toPrefix.endsWith("/")
    ? toPrefix
    : `${toPrefix}/`;
  const toKey = `${normalizedPrefix}${fileName}`;

  if (fromKey === toKey) {
    return NextResponse.json({ success: true, key: toKey });
  }

  try {
    await client.send(
      new CopyObjectCommand({
        Bucket: cfg.bucket,
        CopySource: `${cfg.bucket}/${fromKey}`,
        Key: toKey,
      }),
    );

    await client.send(
      new DeleteObjectCommand({
        Bucket: cfg.bucket,
        Key: fromKey,
      }),
    );

    return NextResponse.json({ success: true, key: toKey });
  } catch (error) {
    console.error("[POST /api/dashboard/r2/move]", error);
    return NextResponse.json(
      { error: "Lỗi khi di chuyển file" },
      { status: 500 },
    );
  }
}

