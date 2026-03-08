"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, Moon, Sun, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useAuthPopupStore } from "@/stores/auth-popup";
import { useThemeStore } from "@/stores/theme";
import { Button } from "@/components/ui/button";
import type { Theme } from "@/stores/theme";

interface ProfilePopupProps {
  /** ClassName cho nút trigger (icon). */
  triggerClassName?: string;
  /** Đang ở trang profile thì highlight trigger. */
  isActive?: boolean;
  /** Kích thước icon: "sm" (mobile) | "md" (desktop). */
  iconSize?: "sm" | "md";
}

export function ProfilePopup({
  triggerClassName,
  isActive = false,
  iconSize = "sm",
}: ProfilePopupProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const openAuthPopup = useAuthPopupStore((s) => s.open);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    setOpen(false);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      logout();
    }
  };

  const iconClass = iconSize === "md" ? "size-6" : "size-5";

  return (
    <div className="relative">
      <button
        type="button"
        data-profile-trigger
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center justify-center rounded-full transition-colors hover:bg-accent hover:text-foreground",
          isActive ? "text-foreground" : "text-muted-foreground",
          triggerClassName,
        )}
        aria-label={user ? "Tài khoản" : "Đăng nhập / Đăng ký"}
        aria-expanded={open}
      >
        <User className={iconClass} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute right-0 top-full z-50 mt-1 min-w-48 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg"
            role="menu"
          >
            {user ? (
              <>
                <div className="border-b border-border px-3 py-2">
                  <p className="truncate text-sm font-medium text-popover-foreground">
                    {user.name || user.username}
                  </p>
                  {user.email && (
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-popover-foreground transition-colors hover:bg-accent"
                  role="menuitem"
                >
                  <User className="size-4 shrink-0" />
                  Tài khoản
                </Link>
                <div className="border-t border-border px-2 py-2">
                  <p className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground">
                    {theme === "dark" ? (
                      <Moon className="size-3.5" />
                    ) : (
                      <Sun className="size-3.5" />
                    )}
                    Giao diện
                  </p>
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      variant={theme === "light" ? "default" : "outline"}
                      size="xs"
                      className="flex-1 gap-1"
                      onClick={() => setTheme("light" as Theme)}
                    >
                      <Sun className="size-3.5" />
                      Sáng
                    </Button>
                    <Button
                      type="button"
                      variant={theme === "dark" ? "default" : "outline"}
                      size="xs"
                      className="flex-1 gap-1"
                      onClick={() => setTheme("dark" as Theme)}
                    >
                      <Moon className="size-3.5" />
                      Tối
                    </Button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-popover-foreground transition-colors hover:bg-accent"
                  role="menuitem"
                >
                  <LogOut className="size-4 shrink-0" />
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    openAuthPopup("login");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-popover-foreground transition-colors hover:bg-accent"
                  role="menuitem"
                >
                  <User className="size-4 shrink-0" />
                  Đăng nhập / Đăng ký
                </button>
                <div className="border-t border-border px-2 py-2">
                  <p className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground">
                    {theme === "dark" ? (
                      <Moon className="size-3.5" />
                    ) : (
                      <Sun className="size-3.5" />
                    )}
                    Giao diện
                  </p>
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      variant={theme === "light" ? "default" : "outline"}
                      size="xs"
                      className="flex-1 gap-1"
                      onClick={() => setTheme("light" as Theme)}
                    >
                      <Sun className="size-3.5" />
                      Sáng
                    </Button>
                    <Button
                      type="button"
                      variant={theme === "dark" ? "default" : "outline"}
                      size="xs"
                      className="flex-1 gap-1"
                      onClick={() => setTheme("dark" as Theme)}
                    >
                      <Moon className="size-3.5" />
                      Tối
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
