"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogIn, User, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useAuthPopupStore } from "@/stores/auth-popup";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Input,
  Label,
} from "@/components/ui";
import type { AuthUser } from "@/stores/auth";

export function AuthPopup() {
  const isOpen = useAuthPopupStore((s) => s.isOpen);
  const tab = useAuthPopupStore((s) => s.tab);
  const close = useAuthPopupStore((s) => s.close);
  const open = useAuthPopupStore((s) => s.open);
  const setUser = useAuthStore((s) => s.setUser);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
  });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setJustLoggedIn(false);
      setAuthError("");
    }
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? "Đăng nhập thất bại");
        return;
      }
      setUser(data.user as AuthUser);
      setLoginForm({ username: "", password: "" });
      setJustLoggedIn(true);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(
          data.error ??
            (data.details ? "Kiểm tra lại thông tin" : "Đăng ký thất bại"),
        );
        return;
      }
      setUser(data.user as AuthUser);
      setRegisterForm({ username: "", password: "", name: "", email: "" });
      setJustLoggedIn(true);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="z-[100] w-full max-w-[min(20rem)] p-3 sm:max-w-md sm:p-5">
        <DialogTitle className="text-base font-semibold sm:text-lg">
          {justLoggedIn
            ? "Đăng nhập thành công"
            : tab === "login"
              ? "Đăng nhập"
              : "Đăng ký"}
        </DialogTitle>

        {justLoggedIn ? (
          <div className="flex flex-col items-center gap-3 py-3 sm:gap-4 sm:py-4">
            <p className="text-xs text-muted-foreground sm:text-sm">
              Bạn đã đăng nhập. Vào trang tài khoản để xem lịch sử và yêu thích.
            </p>
            <Link href="/profile" onClick={close}>
              <Button type="button" size="sm" className="gap-2 sm:h-9 sm:px-4">
                <User className="size-4" />
                Profile
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex gap-1.5 border-b border-border pb-1.5 sm:gap-2 sm:pb-2">
              <button
                type="button"
                onClick={() => {
                  open("login");
                  setAuthError("");
                }}
                className={cn(
                  "rounded px-2.5 py-1.5 text-xs font-medium sm:px-3 sm:py-1.5 sm:text-sm",
                  tab === "login"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  open("register");
                  setAuthError("");
                }}
                className={cn(
                  "rounded px-2.5 py-1.5 text-xs font-medium sm:px-3 sm:py-1.5 sm:text-sm",
                  tab === "register"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                Đăng ký
              </button>
            </div>

            {authError && (
              <p className="mt-2 text-sm text-destructive">{authError}</p>
            )}

            {tab === "login" ? (
              <form
                onSubmit={handleLogin}
                className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3"
              >
                <div className="max-sm:origin-top-left max-sm:scale-y-[0.875] sm:scale-100">
                  <Label className="mb-2 block text-xs sm:text-sm">
                    Tên đăng nhập hoặc email
                  </Label>
                  <Input
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={loginForm.username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLoginForm((p) => ({
                        ...p,
                        username: e.target.value,
                      }))
                    }
                    className="px-2.5 py-1.5 text-base sm:px-3 sm:py-2 sm:text-sm"
                    style={{ fontSize: "16px" }}
                    required
                  />
                </div>
                <div className="max-sm:origin-top-left max-sm:scale-y-[0.875] sm:scale-100">
                  <Label className="mb-2 block text-xs sm:text-sm">
                    Mật khẩu
                  </Label>
                  <Input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLoginForm((p) => ({
                        ...p,
                        password: e.target.value,
                      }))
                    }
                    className="px-2.5 py-1.5 text-base sm:px-3 sm:py-2 sm:text-sm"
                    style={{ fontSize: "16px" }}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={authLoading}
                  size="sm"
                  className="w-full sm:h-9"
                >
                  <LogIn className="size-4" />
                  Đăng nhập
                </Button>
              </form>
            ) : (
              <form
                onSubmit={handleRegister}
                className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3"
              >
                <div className="max-sm:origin-top-left max-sm:scale-[0.875] sm:scale-100">
                  <Label className="mb-0.5 block text-xs sm:mb-1 sm:text-sm">
                    Tên đăng nhập *
                  </Label>
                  <Input
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={registerForm.username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterForm((p) => ({
                        ...p,
                        username: e.target.value,
                      }))
                    }
                    className="px-2.5 py-1.5 text-base sm:px-3 sm:py-2 sm:text-sm"
                    style={{ fontSize: "16px" }}
                    minLength={2}
                    required
                  />
                </div>
                <div className="max-sm:origin-top-left max-sm:scale-[0.875] sm:scale-100">
                  <Label className="mb-0.5 block text-xs sm:mb-1 sm:text-sm">
                    Mật khẩu *
                  </Label>
                  <Input
                    type="password"
                    name="new-password"
                    autoComplete="new-password"
                    value={registerForm.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterForm((p) => ({
                        ...p,
                        password: e.target.value,
                      }))
                    }
                    className="px-2.5 py-1.5 text-base sm:px-3 sm:py-2 sm:text-sm"
                    style={{ fontSize: "16px" }}
                    minLength={6}
                    required
                  />
                </div>
                <div className="max-sm:origin-top-left max-sm:scale-[0.875] sm:scale-100">
                  <Label className="mb-0.5 block text-xs sm:mb-1 sm:text-sm">
                    Tên hiển thị
                  </Label>
                  <Input
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={registerForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className="px-2.5 py-1.5 text-base sm:px-3 sm:py-2 sm:text-sm"
                    style={{ fontSize: "16px" }}
                  />
                </div>
                <div className="max-sm:origin-top-left max-sm:scale-[0.875] sm:scale-100">
                  <Label className="mb-0.5 block text-xs sm:mb-1 sm:text-sm">
                    Email (không bắt buộc)
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={registerForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterForm((p) => ({
                        ...p,
                        email: e.target.value,
                      }))
                    }
                    className="px-2.5 py-1.5 text-base sm:px-3 sm:py-2 sm:text-sm"
                    style={{ fontSize: "16px" }}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={authLoading}
                  size="sm"
                  className="w-full sm:h-9"
                >
                  <UserPlus className="size-4" />
                  Đăng ký
                </Button>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
