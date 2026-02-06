/**
 * Chuyển chuỗi (VD: tiêu đề phim) thành slug URL: lowercase, dấu cách → gạch ngang, bỏ dấu.
 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
