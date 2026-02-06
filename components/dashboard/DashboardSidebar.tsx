"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  FolderOpen,
  Tags,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/dashboard/admin/movies", label: "Danh sách phim", icon: Film },
  { href: "/dashboard/admin/genres", label: "Thể loại", icon: FolderOpen },
  { href: "/dashboard/admin/tags", label: "Tag", icon: Tags },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <span className="font-semibold text-foreground">Drama Phim</span>
        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
          Admin
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ExternalLink className="size-5 shrink-0" />
          Về trang chủ
        </Link>
      </div>
    </aside>
  );
}
