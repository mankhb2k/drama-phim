import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "DramaHD - Tài khoản",
  description: "Quản lý tài khoản, lịch sử xem và danh sách yêu thích tại DramaHD.",
  alternates: getCanonicalUrl("/profile")
    ? { canonical: getCanonicalUrl("/profile") }
    : undefined,
};

export default function ProfileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
