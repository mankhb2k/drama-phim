import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "drama-phim-secret-change-in-production"
);
const COOKIE_NAME = "drama-phim-session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 ngày

export type AuthRole = "ADMIN" | "EDITOR" | "USER";

export interface SessionPayload {
  userId: string;
  username: string;
  role: AuthRole;
  exp: number;
}

export async function signToken(
  payload: Omit<SessionPayload, "exp">
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    const username = payload.username as string;
    const role = payload.role as AuthRole | undefined;
    const exp = payload.exp as number;
    if (!userId || !username) return null;
    const validRole =
      role === "ADMIN" || role === "EDITOR" || role === "USER" ? role : "USER";
    return { userId, username, role: validRole, exp };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getCookieName(): string {
  return COOKIE_NAME;
}

export function getCookieMaxAge(): number {
  return COOKIE_MAX_AGE;
}
