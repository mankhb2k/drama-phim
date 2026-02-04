"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/phim-bo", label: "Phim bộ" },
  { href: "/phim-le", label: "Phim lẻ" },
  { href: "/hoat-hinh", label: "Hoạt hình" },
  { href: "/tv-shows", label: "TV Shows" },
];

const VISIBLE_MENU_COUNT = 3;
const visibleLinks = navLinks.slice(0, VISIBLE_MENU_COUNT);
const moreLinks = navLinks.slice(VISIBLE_MENU_COUNT);

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Layout viewport < 480px: 2 hàng */}
        <div className="flex flex-col min-[481px]:hidden">
          {/* Hàng 1: Logo | Thanh tìm kiếm */}
          <div className="flex h-12 items-center gap-3 py-2">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-1.5 text-base font-bold text-primary"
            >
              <span className="rounded bg-primary px-1.5 py-0.5 text-primary-foreground">
                Drama
              </span>
              <span>Phim</span>
            </Link>
            <div className="flex min-w-0 flex-1 gap-2">
              <input
                type="search"
                placeholder="Tìm phim, diễn viên..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Search className="size-4" />
              </button>
            </div>
          </div>

          {/* Hàng 2: 3 menu | Mở rộng | Account */}
          <div className="flex h-11 items-center justify-between border-t border-border/40">
            <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {visibleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="shrink-0 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex shrink-0 items-center gap-1">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label={mobileMenuOpen ? "Đóng menu" : "Mở thêm menu"}
                  aria-expanded={mobileMenuOpen}
                >
                  <ChevronDown
                    className={cn(
                      "size-5 transition-transform",
                      mobileMenuOpen && "rotate-180"
                    )}
                  />
                </button>
                {mobileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMobileMenuOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-border bg-popover py-1 shadow-lg">
                      {moreLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm font-medium text-popover-foreground transition-colors hover:bg-accent"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <Link
                href="/login"
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Đăng nhập"
              >
                <User className="size-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Layout viewport >= 480px: hàng đơn */}
        <div className="hidden min-[481px]:block">
          <div className="flex h-14 items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold text-primary sm:text-xl"
            >
              <span className="rounded bg-primary px-2 py-0.5 text-primary-foreground">
                Drama
              </span>
              <span className="hidden sm:inline">Phim</span>
            </Link>

            <nav className="flex items-center gap-4 sm:gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Tìm kiếm"
              >
                <Search className="size-5" />
              </button>

              <Link
                href="/login"
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Đăng nhập"
              >
                <User className="size-5" />
              </Link>
            </div>
          </div>

          {searchOpen && (
            <div className="border-t border-border/40 py-3">
              <div className="flex gap-2">
                <input
                  type="search"
                  placeholder="Tìm phim, diễn viên..."
                  className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                <button
                  type="button"
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Tìm
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
