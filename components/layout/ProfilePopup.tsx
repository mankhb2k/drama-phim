"use client";

import Link from "next/link";
import { LogOut, Moon, Sun, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useAuthPopupStore } from "@/stores/auth-popup";
import { useThemeStore } from "@/stores/theme";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
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

  const handleLogout = async () => {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-profile-trigger
          className={cn(
            "flex items-center justify-center rounded-full transition-colors hover:bg-accent hover:text-foreground",
            isActive ? "text-foreground" : "text-muted-foreground",
            triggerClassName,
          )}
          aria-label={user ? "Tài khoản" : "Đăng nhập / Đăng ký"}
        >
          <User className={iconClass} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {user ? (
          <>
            <DropdownMenuLabel>
              <p className="truncate text-sm font-medium">
                {user.name || user.username}
              </p>
              {user.email && (
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </p>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex cursor-pointer items-center gap-2">
                <User className="size-4 shrink-0" />
                Tài khoản
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              {theme === "dark" ? (
                <Moon className="size-3.5" />
              ) : (
                <Sun className="size-3.5" />
              )}
              Giao diện
            </DropdownMenuLabel>
            <div className="flex gap-1.5 px-2 py-1.5">
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
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onSelect={(e: Event) => {
                e.preventDefault();
                void handleLogout();
              }}
            >
              <LogOut className="size-4 shrink-0" />
              Đăng xuất
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => openAuthPopup("login")}
            >
              <User className="size-4 shrink-0" />
              Đăng nhập / Đăng ký
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              {theme === "dark" ? (
                <Moon className="size-3.5" />
              ) : (
                <Sun className="size-3.5" />
              )}
              Giao diện
            </DropdownMenuLabel>
            <div className="flex gap-1.5 px-2 py-1.5">
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
