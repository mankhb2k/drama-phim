import { NextResponse } from "next/server";
import { getCookieName } from "@/lib/auth";

/** POST /api/auth/logout */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
