import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COVER_LEGACY_HOST = "img.harunalegging.shop";
const COVER_HOST = "cover.dramahd.net";

/**
 * Chuyển URL ảnh poster/backdrop từ host cũ sang cover.dramahd.net để dùng với next/image.
 */
export function normalizeCoverImageUrl(
  url: string | null | undefined
): string | undefined {
  if (!url?.trim()) return undefined;
  try {
    const u = new URL(url);
    if (u.hostname === COVER_LEGACY_HOST) {
      u.hostname = COVER_HOST;
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

/**
 * So sánh theo kiểu Windows: chữ theo thứ tự, số theo giá trị (file1, file2, file10).
 * Dùng để sắp xếp tên file/folder tự nhiên (natural / alphanumeric sort).
 */
export function naturalCompare(a: string, b: string): number {
  const chunkRe = /(\d+|\D+)/g;
  const chunksA = (a.toLowerCase().match(chunkRe) ?? []) as string[];
  const chunksB = (b.toLowerCase().match(chunkRe) ?? []) as string[];
  const len = Math.max(chunksA.length, chunksB.length);
  for (let i = 0; i < len; i++) {
    const ca = chunksA[i] ?? "";
    const cb = chunksB[i] ?? "";
    const numA = /^\d+$/.test(ca) ? parseInt(ca, 10) : NaN;
    const numB = /^\d+$/.test(cb) ? parseInt(cb, 10) : NaN;
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
      if (numA !== numB) return numA - numB;
    } else {
      const cmp = ca.localeCompare(cb, undefined, { sensitivity: "base" });
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
}
