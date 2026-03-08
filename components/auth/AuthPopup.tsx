"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogIn, User, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useAuthPopupStore } from "@/stores/auth-popup";
import { Button } from "@/components/ui/button";
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
      return;
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-popup-title"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={close}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-[min(20rem)] rounded-xl border border-border bg-card p-3 shadow-xl sm:max-w-md sm:p-5"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <h2
            id="auth-popup-title"
            className="text-base font-semibold text-foreground sm:text-lg"
          >
            {justLoggedIn
              ? "Đăng nhập thành công"
              : tab === "login"
                ? "Đăng nhập"
                : "Đăng ký"}
          </h2>
          <button
            type="button"
            onClick={close}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

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
                <div>
                  <label className="mb-2 block text-xs font-medium text-foreground sm:mb-2 sm:text-sm">
                    Tên đăng nhập hoặc email
                  </label>
                  <div className="max-sm:origin-top-left max-sm:scale-y-[0.875] sm:scale-100">
                    <input
                      type="text"
                      value={loginForm.username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setLoginForm((p) => ({
                          ...p,
                          username: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-base sm:px-3 sm:py-2 sm:text-sm"
                      style={{ fontSize: "16px" }}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-foreground sm:mb-2 sm:text-sm">
                    Mật khẩu
                  </label>
                  <div className="max-sm:origin-top-left max-sm:scale-y-[0.875] sm:scale-100">
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setLoginForm((p) => ({
                          ...p,
                          password: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-base sm:px-3 sm:py-2 sm:text-sm"
                      style={{ fontSize: "16px" }}
                      required
                    />
                  </div>
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
                <div>
                  <label className="mb-2 block text-xs font-medium text-foreground sm:mb-2 sm:text-sm">
                    Tên đăng nhập *
                  </label>
                  <div className="max-sm:origin-top-left max-sm:scale-[0.875] sm:scale-100">
                    <input
                      type="text"
                      value={registerForm.username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setRegisterForm((p) => ({
                          ...p,
                          username: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-base sm:px-3 sm:py-2 sm:text-sm"
                      style={{ fontSize: "16px" }}
                      minLength={2}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-0.5 block text-xs font-medium text-foreground sm:mb-1 sm:text-sm">
                    Mật khẩu *
                  </label>
                  <div className="max-sm:origin-top-left max-sm:scale-[0.875] sm:scale-100">
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setRegisterForm((p) => ({
                          ...p,
                          password: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-base sm:px-3 sm:py-2 sm:text-sm"
                      style={{ fontSize: "16px" }}
                      minLength={6}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-0.5 block text-xs font-medium text-foreground sm:mb-1 sm:text-sm">
                    Tên hiển thị
                  </label>
                  <div className="max-sm:origin-top-left max-sm:scale-[0.875] sm:scale-100">
                    <input
                      type="text"
                      value={registerForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setRegisterForm((p) => ({ ...p, name: e.target.value }))
                      }
                      className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-base sm:px-3 sm:py-2 sm:text-sm"
                      style={{ fontSize: "16px" }}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-0.5 block text-xs font-medium text-foreground sm:mb-1 sm:text-sm">
                    Email (không bắt buộc)
                  </label>
                  <div className="max-sm:origin-top-left max-sm:scale-[0.875] sm:scale-100">
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setRegisterForm((p) => ({
                          ...p,
                          email: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-base sm:px-3 sm:py-2 sm:text-sm"
                      style={{ fontSize: "16px" }}
                    />
                  </div>
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
      </div>
    </div>
  );
}
