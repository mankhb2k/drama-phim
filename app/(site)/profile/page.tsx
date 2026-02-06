"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { Button } from "@/components/ui/button";
import { buildWatchHref } from "@/lib/watch-slug";
import { cn } from "@/lib/utils";
import {
  User,
  LogIn,
  UserPlus,
  LogOut,
  History,
  Heart,
  Sun,
  Moon,
  Play,
  X,
} from "lucide-react";
import type { AuthUser } from "@/stores/auth";
import type { Theme } from "@/stores/theme";

interface WatchHistoryItem {
  id: string;
  movieId: number;
  episodeId: number | null;
  progressSeconds: number;
  lastWatchedAt: string;
  movie: {
    id: number;
    slug: string;
    title: string;
    poster: string | null;
    year: number | null;
    status: string;
    episodes: number;
  };
}

interface FavoriteItem {
  id: string;
  movieId: number;
  movie: {
    id: number;
    slug: string;
    title: string;
    poster: string | null;
    year: number | null;
    status: string;
    episodes: number;
  };
}

const placeholderPoster =
  "linear-gradient(135deg, oklch(0.45 0.02 264) 0%, oklch(0.25 0.03 280) 100%)";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
  });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [authPopupOpen, setAuthPopupOpen] = useState(false);

  const openAuthPopup = (tab: "login" | "register") => {
    setAuthTab(tab);
    setAuthPopupOpen(true);
    setAuthError("");
  };

  useEffect(() => {
    if (!authPopupOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAuthPopupOpen(false);
    };
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [authPopupOpen]);

  useEffect(() => {
    if (!user) return;
    setLoadingHistory(true);
    fetch("/api/profile/watch-history", { credentials: "include" })
      .then((res) => res.json())
      .then((data: { items?: WatchHistoryItem[] }) => {
        setWatchHistory(data.items ?? []);
      })
      .finally(() => setLoadingHistory(false));

    setLoadingFavorites(true);
    fetch("/api/profile/favorites", { credentials: "include" })
      .then((res) => res.json())
      .then((data: { items?: FavoriteItem[] }) => {
        setFavorites(data.items ?? []);
      })
      .finally(() => setLoadingFavorites(false));
  }, [user]);

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
      useAuthStore.getState().setUser(data.user as AuthUser);
      setLoginForm({ username: "", password: "" });
      setAuthPopupOpen(false);
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
          data.error ?? (data.details ? "Kiểm tra lại thông tin" : "Đăng ký thất bại")
        );
        return;
      }
      useAuthStore.getState().setUser(data.user as AuthUser);
      setRegisterForm({ username: "", password: "", name: "", email: "" });
      setAuthPopupOpen(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    logout();
  };

  const removeFavorite = async (movieId: number) => {
    const res = await fetch("/api/profile/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movieId }),
      credentials: "include",
    });
    const data = await res.json();
    if (data.added === false) {
      setFavorites((prev) => prev.filter((f) => f.movieId !== movieId));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        Tài khoản
      </h1>

      {/* Nút Đăng nhập / Đăng ký (trên Giao diện) — khi nhấn sẽ hiện form */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        {user ? (
          <>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
              <User className="size-5" />
              Thông tin
            </h2>
            <p className="text-sm text-muted-foreground">
              {user.name || user.username}
              {user.email && ` · ${user.email}`}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Đăng xuất
            </Button>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openAuthPopup("login")}
            >
              <LogIn className="size-4" />
              Đăng nhập
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openAuthPopup("register")}
            >
              <UserPlus className="size-4" />
              Đăng ký
            </Button>
          </div>
        )}
      </section>

      {/* Giao diện: sáng / tối */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
          {theme === "dark" ? (
            <Moon className="size-5" />
          ) : (
            <Sun className="size-5" />
          )}
          Giao diện
        </h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={theme === "light" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("light" as Theme)}
          >
            <Sun className="size-4" />
            Sáng
          </Button>
          <Button
            type="button"
            variant={theme === "dark" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("dark" as Theme)}
          >
            <Moon className="size-4" />
            Tối
          </Button>
        </div>
      </section>

      {/* Lịch sử xem — luôn hiện; chưa đăng nhập thì ấn vào mở popup */}
      <section
        className={cn(
          "rounded-xl border border-border bg-card p-4 shadow-sm",
          !user && "cursor-pointer transition-colors hover:bg-accent/50"
        )}
        onClick={() => {
          if (!user) openAuthPopup("login");
        }}
        onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
          if (!user && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            openAuthPopup("login");
          }
        }}
        role={!user ? "button" : undefined}
        tabIndex={!user ? 0 : undefined}
      >
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
          <History className="size-5" />
          Lịch sử xem
        </h2>
        {!user ? (
          <p className="text-sm text-muted-foreground">
            Đăng nhập để xem lịch sử xem của bạn. Nhấn vào đây để đăng nhập hoặc đăng ký.
          </p>
        ) : loadingHistory ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : watchHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có lịch sử xem.{" "}
            <Link href="/" className="text-primary underline" onClick={(e) => e.stopPropagation()}>
              Xem phim
            </Link>
          </p>
        ) : (
          <div
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
            onClick={(e) => e.stopPropagation()}
          >
            {watchHistory.map((h) => (
              <Link
                key={h.id}
                href={
                  h.episodeId
                    ? buildWatchHref(h.movie.slug, h.episodeId)
                    : `/movies/${h.movie.slug}`
                }
                className="group shrink-0"
              >
                <div className="relative aspect-[2/3] w-[120px] overflow-hidden rounded-lg bg-muted sm:w-[140px]">
                  {h.movie.poster ? (
                    <Image
                      src={h.movie.poster}
                      alt={h.movie.title}
                      fill
                      sizes="140px"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="size-full"
                      style={{ background: placeholderPoster }}
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Play className="size-8 text-white" />
                  </div>
                  {h.progressSeconds > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted-foreground/30">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.min(100, (h.progressSeconds / 7200) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground">
                  {h.movie.title}
                </p>
                {h.episodeId && (
                  <p className="text-xs text-muted-foreground">
                    Tập {h.episodeId}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Phim yêu thích — luôn hiện; chưa đăng nhập thì ấn vào mở popup */}
      <section
        className={cn(
          "rounded-xl border border-border bg-card p-4 shadow-sm",
          !user && "cursor-pointer transition-colors hover:bg-accent/50"
        )}
        onClick={() => {
          if (!user) openAuthPopup("login");
        }}
        onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
          if (!user && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            openAuthPopup("login");
          }
        }}
        role={!user ? "button" : undefined}
        tabIndex={!user ? 0 : undefined}
      >
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Heart className="size-5" />
          Phim yêu thích
        </h2>
        {!user ? (
          <p className="text-sm text-muted-foreground">
            Đăng nhập để lưu phim yêu thích. Nhấn vào đây để đăng nhập hoặc đăng ký.
          </p>
        ) : loadingFavorites ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : favorites.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có phim yêu thích. Thêm từ trang phim khi xem.
          </p>
        ) : (
          <div
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
            onClick={(e) => e.stopPropagation()}
          >
            {favorites.map((f) => (
              <div key={f.id} className="group relative shrink-0">
                <Link
                  href={`/movies/${f.movie.slug}`}
                  className="block"
                >
                  <div className="relative aspect-[2/3] w-[120px] overflow-hidden rounded-lg bg-muted sm:w-[140px]">
                    {f.movie.poster ? (
                      <Image
                        src={f.movie.poster}
                        alt={f.movie.title}
                        fill
                        sizes="140px"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="size-full"
                        style={{ background: placeholderPoster }}
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Play className="size-8 text-white" />
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground">
                    {f.movie.title}
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(f.movieId);
                  }}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                  aria-label="Bỏ yêu thích"
                >
                  <Heart className="size-4 fill-current" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Popup đăng nhập / đăng ký */}
      {authPopupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setAuthPopupOpen(false)}
          aria-modal="true"
          role="dialog"
          aria-labelledby="auth-popup-title"
        >
          <div
            className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="auth-popup-title" className="text-lg font-semibold text-foreground">
                {authTab === "login" ? "Đăng nhập" : "Đăng ký"}
              </h2>
              <button
                type="button"
                onClick={() => setAuthPopupOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Đóng"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex gap-2 border-b border-border pb-2">
              <button
                type="button"
                onClick={() => {
                  setAuthTab("login");
                  setAuthError("");
                }}
                className={cn(
                  "rounded px-3 py-1.5 text-sm font-medium",
                  authTab === "login"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab("register");
                  setAuthError("");
                }}
                className={cn(
                  "rounded px-3 py-1.5 text-sm font-medium",
                  authTab === "register"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                Đăng ký
              </button>
            </div>

            {authError && (
              <p className="mt-2 text-sm text-destructive">{authError}</p>
            )}

            {authTab === "login" ? (
              <form onSubmit={handleLogin} className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Tên đăng nhập hoặc email
                  </label>
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) =>
                      setLoginForm((p) => ({ ...p, username: e.target.value }))
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm((p) => ({ ...p, password: e.target.value }))
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <Button type="submit" disabled={authLoading} className="w-full">
                  <LogIn className="size-4" />
                  Đăng nhập
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Tên đăng nhập *
                  </label>
                  <input
                    type="text"
                    value={registerForm.username}
                    onChange={(e) =>
                      setRegisterForm((p) => ({ ...p, username: e.target.value }))
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    minLength={2}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Mật khẩu *
                  </label>
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(e) =>
                      setRegisterForm((p) => ({ ...p, password: e.target.value }))
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    minLength={6}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Tên hiển thị
                  </label>
                  <input
                    type="text"
                    value={registerForm.name}
                    onChange={(e) =>
                      setRegisterForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Email (không bắt buộc)
                  </label>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) =>
                      setRegisterForm((p) => ({ ...p, email: e.target.value }))
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <Button type="submit" disabled={authLoading} className="w-full">
                  <UserPlus className="size-4" />
                  Đăng ký
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
