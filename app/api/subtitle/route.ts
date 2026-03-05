import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const subtitleQuerySchema = z.object({
  url: z.string().url(),
});

/** Chỉ cho phép URL tới file phụ đề (.vtt/.srt) hoặc host trong ALLOWED_SUBTITLE_ORIGINS */
function isAllowedSubtitleUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const path = u.pathname.toLowerCase();
    if (/\.(vtt|srt)(\?|$)/i.test(path)) return true;
    const allowedHosts = process.env.ALLOWED_SUBTITLE_ORIGINS?.split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);
    if (allowedHosts?.length && allowedHosts.includes(u.hostname.toLowerCase()))
      return true;
    return false;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = subtitleQuerySchema.safeParse({
    url: searchParams.get("url") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Thiếu hoặc sai tham số url" },
      { status: 400 },
    );
  }

  const { url } = parsed.data;
  if (!isAllowedSubtitleUrl(url)) {
    return NextResponse.json(
      { error: "URL không được phép" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "text/vtt, text/plain, */*" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream trả về ${res.status}` },
        { status: res.status === 404 ? 404 : 502 },
      );
    }

    const contentType = res.headers.get("content-type") ?? "text/vtt";
    const body = await res.text();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType.includes("vtt")
          ? "text/vtt"
          : "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    console.error("[api/subtitle] fetch error", err);
    return NextResponse.json(
      { error: "Không thể tải phụ đề" },
      { status: 502 },
    );
  }
}
